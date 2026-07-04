import { Reservation } from "../../domain/reservation";
import { ReservationError, ReservationNotFoundError } from "../errors/reservation.error";
import { ReservationPolicy, ReservationTransaction, ReservationUnitOfWork } from "../ports/reservation-unit-of-work.port";

interface IdentifierGenerator { next(): string; }
interface Clock { now(): Date; }

const view = (reservation: Reservation) => ({
  ...reservation.toSnapshot(),
  createdAt: reservation.createdAt.toISOString(),
  holdExpiresAt: reservation.holdExpiresAt?.toISOString() ?? null,
});

async function allocate(
  tx: ReservationTransaction,
  ids: IdentifierGenerator,
  clock: Clock,
  policy: ReservationPolicy,
  bookTitleId: string,
  branchId: string,
) {
  const reservation = await tx.findNextWaiting(bookTitleId, branchId);
  const copy = await tx.findAvailableCopy(bookTitleId, branchId);
  if (!reservation || !copy) return null;
  reservation.allocate(copy.id, new Date(clock.now().getTime() + policy.holdHours * 3_600_000));
  copy.status = "ON_HOLD";
  await tx.saveReservation(reservation);
  await tx.saveCopy(copy);
  await tx.addOutbox({
    id: ids.next(), reservationId: reservation.id, readerId: reservation.readerId, type: "HOLD_READY",
    payload: { copyId: copy.id, expiresAt: reservation.holdExpiresAt!.toISOString() },
  });
  return reservation;
}

export class PlaceReservationUseCase {
  constructor(private uow: ReservationUnitOfWork, private ids: IdentifierGenerator, private clock: Clock) {}
  execute(command: { actorId: string; readerId: string; bookTitleId: string; branchId: string }) {
    return this.uow.execute(async tx => {
      const reader = await tx.findReader(command.readerId);
      if (!reader?.active) throw new ReservationError("Reader is not eligible");
      if (!await tx.titleExists(command.bookTitleId)) throw new ReservationNotFoundError("Book title not found");
      if (!await tx.branchExists(command.branchId)) throw new ReservationNotFoundError("Branch not found");
      if (await tx.findDuplicate(command.readerId, command.bookTitleId, command.branchId)) throw new ReservationError("Reader already has active reservation");
      const policy = await tx.getActivePolicy();
      if (await tx.countActive(command.readerId) >= policy.maxActiveReservations) throw new ReservationError("Reservation limit exceeded");
      const reservation = Reservation.create({ id: this.ids.next(), readerId: command.readerId, bookTitleId: command.bookTitleId, branchId: command.branchId, createdAt: this.clock.now() });
      await tx.saveReservation(reservation);
      const allocated = await allocate(tx, this.ids, this.clock, policy, command.bookTitleId, command.branchId);
      await tx.appendAudit({ actorId: command.actorId, action: "RESERVATION_PLACED", aggregateId: reservation.id });
      return view(allocated?.id === reservation.id ? allocated : reservation);
    });
  }
}

export class CancelReservationUseCase {
  constructor(private uow: ReservationUnitOfWork, private ids: IdentifierGenerator, private clock: Clock) {}
  execute(command: { id: string; actorId: string; requesterReaderId?: string; reason: string }) {
    return this.uow.execute(async tx => {
      const reservation = await tx.findReservation(command.id);
      if (!reservation) throw new ReservationNotFoundError("Reservation not found");
      if (command.requesterReaderId && reservation.readerId !== command.requesterReaderId) throw new ReservationError("Reservation is not owned by reader");
      const copyId = reservation.copyId;
      try { reservation.cancel(command.reason); } catch (error) { throw new ReservationError((error as Error).message); }
      await tx.saveReservation(reservation);
      if (copyId) await tx.saveCopy({ id: copyId, bookTitleId: reservation.bookTitleId, branchId: reservation.branchId, status: "AVAILABLE" });
      await tx.appendAudit({ actorId: command.actorId, action: "RESERVATION_CANCELLED", aggregateId: reservation.id });
      if (copyId) await allocate(tx, this.ids, this.clock, await tx.getActivePolicy(), reservation.bookTitleId, reservation.branchId);
      return view(reservation);
    });
  }
}

export class AllocateReservationsUseCase {
  constructor(private uow: ReservationUnitOfWork, private ids: IdentifierGenerator, private clock: Clock) {}
  execute(bookTitleId: string, branchId: string) {
    return this.uow.execute(async tx => {
      const reservation = await allocate(tx, this.ids, this.clock, await tx.getActivePolicy(), bookTitleId, branchId);
      return reservation ? view(reservation) : null;
    });
  }
  executeAll() {
    return this.uow.execute(async tx => {
      const policy = await tx.getActivePolicy(); let allocated = 0;
      for (const queue of await tx.findWaitingQueues()) {
        while (await allocate(tx, this.ids, this.clock, policy, queue.bookTitleId, queue.branchId)) allocated += 1;
      }
      return allocated;
    });
  }
}

export class ExpireReservationsUseCase {
  constructor(private uow: ReservationUnitOfWork, private ids: IdentifierGenerator, private clock: Clock) {}
  execute() {
    return this.uow.execute(async tx => {
      const rows = await tx.findExpired(this.clock.now()); const policy = await tx.getActivePolicy();
      for (const reservation of rows) {
        const copyId = reservation.copyId; reservation.expire(); await tx.saveReservation(reservation);
        if (copyId) {
          await tx.saveCopy({ id: copyId, bookTitleId: reservation.bookTitleId, branchId: reservation.branchId, status: "AVAILABLE" });
          await allocate(tx, this.ids, this.clock, policy, reservation.bookTitleId, reservation.branchId);
        }
      }
      return rows.length;
    });
  }
}

export class ListReservationsUseCase {
  constructor(private uow: ReservationUnitOfWork) {}
  execute(readerId: string, requesterReaderId?: string) {
    if (requesterReaderId && requesterReaderId !== readerId) return Promise.reject(new ReservationError("Reader is not allowed to view these reservations"));
    return this.uow.execute(async tx => (await tx.findByReader(readerId)).map(view));
  }
}
