import { Loan } from "../../domain/entities/loan";
import { ReturnCondition } from "../../domain/enums/return-condition.enum";
import { CirculationDomainError } from "../../domain/errors/circulation-domain.error";
import { CirculationError, CirculationNotFoundError } from "../errors/circulation.error";
import { CirculationUnitOfWork } from "../ports/circulation-unit-of-work.port";
import { CirculationIdentifierGenerator, Clock, FineAssessmentPort, ReservationEligibilityPort } from "../ports/circulation.ports";
const view = (x: Loan) => ({ ...x.toSnapshot(), borrowedAt: x.borrowedAt.toISOString(), items: x.items.map(i => ({ ...i, dueAt: i.dueAt.toISOString(), returnedAt: i.returnedAt?.toISOString() ?? null })) });
function domain<T>(work: () => T): T { try { return work(); } catch (e) { if (e instanceof CirculationDomainError) throw new CirculationError(e.message); throw e; } }
export class BorrowBooksUseCase {
  constructor(private uow: CirculationUnitOfWork, private ids: CirculationIdentifierGenerator, private clock: Clock) {}
  execute(c: { actorId: string; cardNumber: string; barcodes: string[] }) { return this.uow.execute(async tx => {
    const now = this.clock.now(), card = c.cardNumber.trim().toUpperCase(), barcodes = [...new Set(c.barcodes.map(x => x.trim().toUpperCase()))];
    if (!barcodes.length || barcodes.length !== c.barcodes.length) throw new CirculationError("Unique barcodes are required");
    const reader = await tx.findReaderByCard(card); if (!reader) throw new CirculationNotFoundError("Library card was not found");
    if (reader.readerStatus !== "ACTIVE" || reader.cardStatus !== "ACTIVE" || reader.cardExpiresAt <= now) throw new CirculationError("Reader or library card is not eligible to borrow");
    const policy = await tx.getActivePolicy(), active = await tx.countActiveItems(reader.readerId);
    if (active + barcodes.length > policy.maxActiveItems) throw new CirculationError("Reader borrowing limit exceeded");
    const copies = await tx.findCopiesByBarcodes(barcodes); if (copies.length !== barcodes.length) throw new CirculationNotFoundError("One or more book copies were not found");
    for (const copy of copies) {
      const eligibleHold = copy.status === "ON_HOLD" && await tx.isCopyHeldForReader(copy.id, reader.readerId);
      if (copy.status !== "AVAILABLE" && !eligibleHold) throw new CirculationError("One or more book copies are unavailable");
    }
    if (new Set(copies.map(x => x.branchId)).size !== 1) throw new CirculationError("All copies must belong to one branch");
    const due = new Date(now.getTime() + policy.loanDays * 86_400_000);
    const loan = Loan.create({ id: this.ids.next(), readerId: reader.readerId, cardId: reader.cardId, branchId: copies[0].branchId, staffId: c.actorId, borrowedAt: now, items: copies.map(x => ({ id: this.ids.next(), copyId: x.id, bookTitleId: x.bookTitleId, dueAt: due })) });
    const heldCopyIds = copies.filter(x => x.status === "ON_HOLD").map(x => x.id);
    copies.forEach(x => x.status = "ON_LOAN"); await tx.saveLoan(loan); await tx.saveCopies(copies);
    if (heldCopyIds.length) await tx.completeHeldReservations(heldCopyIds, reader.readerId);
    await tx.appendAudit({ actorId: c.actorId, action: "BOOKS_BORROWED", aggregateId: loan.id }); return view(loan);
  }); }
}
export class ReturnBooksUseCase {
  constructor(private uow: CirculationUnitOfWork, private clock: Clock, private fines: FineAssessmentPort = { assess: async () => undefined }) {}
  async execute(c: { actorId: string; returns: Array<{ barcode: string; condition: ReturnCondition }> }) { const assessed = await this.uow.execute(async tx => {
    const requested = c.returns.map(x => ({ ...x, barcode: x.barcode.trim().toUpperCase() })); const records = await tx.findOpenItemsByBarcodes(requested.map(x => x.barcode));
    if (records.length !== requested.length) throw new CirculationNotFoundError("One or more open loan items were not found");
    const byLoan = new Map<string, typeof records>(); for (const r of records) byLoan.set(r.loan.id, [...(byLoan.get(r.loan.id) ?? []), r]);
    const output: any[] = [];
    for (const group of byLoan.values()) {
      const loan = group[0].loan; domain(() => loan.returnItems(group.map(r => ({ itemId: r.item.id, condition: requested.find(x => x.barcode === r.copy.barcode)!.condition })), this.clock.now()));
      for (const r of group) { const condition = requested.find(x => x.barcode === r.copy.barcode)!.condition; r.copy.status = condition === ReturnCondition.NORMAL ? "AVAILABLE" : condition; const item = loan.items.find(x => x.id === r.item.id)!; output.push({ loanItemId: item.id, barcode: r.copy.barcode, condition, overdueDays: item.overdueDays }); }
      await tx.saveLoan(loan); await tx.saveCopies(group.map(x => x.copy)); await tx.appendAudit({ actorId: c.actorId, action: "BOOKS_RETURNED", aggregateId: loan.id });
    } return output;
  }); for(const item of assessed)await this.fines.assess({actorId:c.actorId,loanItemId:item.loanItemId});return assessed.map(({loanItemId,...result})=>result); }
}
export class RenewLoanUseCase {
  constructor(private uow: CirculationUnitOfWork, private reservations: ReservationEligibilityPort, private clock: Clock) {}
  execute(c: { actorId: string; loanId: string; itemIds?: string[]; requesterReaderId?: string }) { return this.uow.execute(async tx => {
    const loan = await tx.findLoanById(c.loanId); if (!loan) throw new CirculationNotFoundError("Loan was not found"); const policy = await tx.getActivePolicy();
    if (c.requesterReaderId && loan.readerId !== c.requesterReaderId) throw new CirculationError("Loan is not owned by the authenticated reader");
    const ids = c.itemIds?.length ? c.itemIds : loan.items.filter(x => !x.returnedAt).map(x => x.id); const reserved = new Set<string>();
    for (const item of loan.items.filter(x => ids.includes(x.id))) if (await this.reservations.hasWaitingReservation(item.bookTitleId, loan.readerId)) reserved.add(item.bookTitleId);
    domain(() => loan.renewItems(ids, this.clock.now(), policy.renewalDays, policy.maxRenewals, reserved)); await tx.saveLoan(loan); await tx.appendAudit({ actorId: c.actorId, action: "LOAN_RENEWED", aggregateId: loan.id }); return view(loan);
  }); }
}
export class ListReaderLoansUseCase { constructor(private uow: CirculationUnitOfWork) {} execute(readerId: string, requesterReaderId?: string) { if (requesterReaderId && requesterReaderId !== readerId) return Promise.reject(new CirculationError("Reader is not allowed to view these loans")); return this.uow.execute(async tx => (await tx.findLoansByReader(readerId)).map(view)); } }
