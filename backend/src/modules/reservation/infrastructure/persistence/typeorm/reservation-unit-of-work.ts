import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In, LessThanOrEqual } from "typeorm";
import { BookCopyOrmEntity } from "@modules/catalog/infrastructure/persistence/typeorm/entities/book-copy.orm-entity";
import { BookTitleOrmEntity } from "@modules/catalog/infrastructure/persistence/typeorm/entities/book-title.orm-entity";
import { BranchOrmEntity } from "@modules/catalog/infrastructure/persistence/typeorm/entities/branch.orm-entity";
import { LibraryCardOrmEntity } from "@modules/membership/infrastructure/persistence/typeorm/entities/library-card.orm-entity";
import { ReaderOrmEntity } from "@modules/membership/infrastructure/persistence/typeorm/entities/reader.orm-entity";
import { ReservationError } from "../../../application/errors/reservation.error";
import { ReservationCopy, ReservationTransaction, ReservationUnitOfWork } from "../../../application/ports/reservation-unit-of-work.port";
import { Reservation, ReservationStatus } from "../../../domain/reservation";
import { NotificationOutboxOrmEntity, OutboxStatus } from "./entities/notification-outbox.orm-entity";
import { ReservationOrmEntity } from "./entities/reservation.orm-entity";
import { ReservationPolicyOrmEntity } from "./entities/reservation-policy.orm-entity";

@Injectable()
export class TypeOrmReservationUnitOfWork implements ReservationUnitOfWork {
  constructor(private source: DataSource) {}
  async execute<T>(work: (tx: ReservationTransaction) => Promise<T>) {
    try { return await this.source.transaction(manager => work(new ReservationTx(manager))); }
    catch (error) {
      if ((error as any)?.driverError?.code === "23505") throw new ReservationError("Reader already has active reservation");
      throw error;
    }
  }
}

class ReservationTx implements ReservationTransaction {
  constructor(private manager: EntityManager) {}

  async findReader(id: string) {
    const reader = await this.manager.getRepository(ReaderOrmEntity).findOne({ where: { id }, relations: { card: true } });
    const active = !!reader && reader.status === "ACTIVE" && reader.card?.status === "ACTIVE" && reader.card.expiresAt > new Date();
    return reader ? { id: reader.id, active } : null;
  }
  async titleExists(id: string) { return !!await this.manager.getRepository(BookTitleOrmEntity).findOne({ where: { id }, select: { id: true } }); }
  async branchExists(id: string) { return !!await this.manager.getRepository(BranchOrmEntity).findOne({ where: { id }, select: { id: true } }); }
  countActive(readerId: string) { return this.manager.getRepository(ReservationOrmEntity).count({ where: { readerId, status: In([ReservationStatus.WAITING, ReservationStatus.ON_HOLD]) } }); }
  async findDuplicate(readerId: string, bookTitleId: string, branchId: string) {
    const row = await this.manager.getRepository(ReservationOrmEntity).findOne({ where: { readerId, bookTitleId, branchId, status: In([ReservationStatus.WAITING, ReservationStatus.ON_HOLD]) } });
    return row ? this.domain(row) : null;
  }
  async findReservation(id: string) {
    const row = await this.manager.getRepository(ReservationOrmEntity).createQueryBuilder("reservation").where("reservation.id = :id", { id }).setLock("pessimistic_write").getOne();
    return row ? this.domain(row) : null;
  }
  async saveReservation(value: Reservation) {
    const x = value.toSnapshot();
    await this.manager.getRepository(ReservationOrmEntity).save({ id: x.id, readerId: x.readerId, bookTitleId: x.bookTitleId, branchId: x.branchId, status: x.status, copyId: x.copyId, holdExpiresAt: x.holdExpiresAt, cancelReason: x.cancelReason, createdAt: x.createdAt });
  }
  async findNextWaiting(bookTitleId: string, branchId: string) {
    const row = await this.manager.getRepository(ReservationOrmEntity).createQueryBuilder("reservation")
      .where("reservation.bookTitleId = :bookTitleId", { bookTitleId }).andWhere("reservation.branchId = :branchId", { branchId })
      .andWhere("reservation.status = :status", { status: ReservationStatus.WAITING }).orderBy("reservation.createdAt", "ASC").addOrderBy("reservation.id", "ASC")
      .setLock("pessimistic_write").setOnLocked("skip_locked").getOne();
    return row ? this.domain(row) : null;
  }
  async findAvailableCopy(bookTitleId: string, branchId: string) {
    const row = await this.manager.getRepository(BookCopyOrmEntity).createQueryBuilder("copy")
      .where("copy.bookTitleId = :bookTitleId", { bookTitleId }).andWhere("copy.branchId = :branchId", { branchId }).andWhere("copy.status = 'AVAILABLE'")
      .orderBy("copy.createdAt", "ASC").addOrderBy("copy.id", "ASC").setLock("pessimistic_write").setOnLocked("skip_locked").getOne();
    return row ? this.copy(row) : null;
  }
  async findExpired(now: Date) {
    const rows = await this.manager.getRepository(ReservationOrmEntity).createQueryBuilder("reservation")
      .where("reservation.status = :status", { status: ReservationStatus.ON_HOLD }).andWhere("reservation.holdExpiresAt <= :now", { now })
      .orderBy("reservation.holdExpiresAt", "ASC").setLock("pessimistic_write").setOnLocked("skip_locked").getMany();
    return rows.map(row => this.domain(row));
  }
  async saveCopy(value: ReservationCopy) { await this.manager.getRepository(BookCopyOrmEntity).save({ id: value.id, status: value.status as any }); }
  async addOutbox(value: { id: string; reservationId: string; readerId: string; type: string; payload: Record<string, unknown> }) {
    await this.manager.getRepository(NotificationOutboxOrmEntity).save({ ...value, status: OutboxStatus.PENDING, attempts: 0, nextAttemptAt: new Date(), lastError: null, sentAt: null });
  }
  async appendAudit(event: { actorId: string; action: string; aggregateId: string; details?: Record<string, unknown> }) {
    await this.manager.query("INSERT INTO audit_logs (actor_id,action,aggregate_type,aggregate_id,reason,details) VALUES ($1,$2,$3,$4,$5,$6::jsonb)", [event.actorId, event.action, "Reservation", event.aggregateId, null, JSON.stringify(event.details ?? {})]);
  }
  async getActivePolicy() {
    const row = await this.manager.getRepository(ReservationPolicyOrmEntity).findOne({ where: { isActive: true }, order: { effectiveFrom: "DESC" } });
    if (!row) throw new Error("Active reservation policy is not configured");
    return { maxActiveReservations: row.maxActiveReservations, holdHours: row.holdHours };
  }
  async findByReader(readerId: string) {
    const rows = await this.manager.getRepository(ReservationOrmEntity).find({ where: { readerId }, order: { createdAt: "DESC" } });
    return rows.map(row => this.domain(row));
  }
  async findWaitingQueues() {
    return this.manager.getRepository(ReservationOrmEntity).createQueryBuilder("reservation")
      .select("reservation.bookTitleId", "bookTitleId").addSelect("reservation.branchId", "branchId")
      .where("reservation.status = :status", { status: ReservationStatus.WAITING }).groupBy("reservation.bookTitleId").addGroupBy("reservation.branchId")
      .getRawMany<{ bookTitleId: string; branchId: string }>();
  }
  private copy(row: BookCopyOrmEntity): ReservationCopy { return { id: row.id, bookTitleId: row.bookTitleId, branchId: row.branchId, status: row.status }; }
  private domain(row: ReservationOrmEntity) { return Reservation.restore({ id: row.id, readerId: row.readerId, bookTitleId: row.bookTitleId, branchId: row.branchId, status: row.status, copyId: row.copyId, holdExpiresAt: row.holdExpiresAt, cancelReason: row.cancelReason, createdAt: row.createdAt }); }
}
