import { LoanItemStatus, LoanStatus } from "../enums/loan-status.enum";
import { ReturnCondition } from "../enums/return-condition.enum";
import { CirculationDomainError } from "../errors/circulation-domain.error";
export interface LoanItemSnapshot { id: string; copyId: string; bookTitleId: string; dueAt: Date; status: LoanItemStatus; returnedAt: Date | null; returnCondition: ReturnCondition | null; overdueDays: number; renewalCount: number; }
export interface LoanSnapshot { id: string; readerId: string; cardId: string; branchId: string; staffId: string; borrowedAt: Date; status: LoanStatus; items: LoanItemSnapshot[]; }
export interface CreateLoanInput extends Omit<LoanSnapshot, "status" | "items"> { items: Array<Pick<LoanItemSnapshot, "id" | "copyId" | "bookTitleId" | "dueAt">>; }
export class Loan {
  private constructor(private state: LoanSnapshot) {}
  static create(x: CreateLoanInput) {
    if (!x.items.length) throw new CirculationDomainError("Loan must contain at least one item");
    const ids = new Set(x.items.map(i => i.copyId)); if (ids.size !== x.items.length) throw new CirculationDomainError("Loan contains duplicate copies");
    return new Loan({ ...x, borrowedAt: new Date(x.borrowedAt), status: LoanStatus.OPEN, items: x.items.map(i => ({ ...i, dueAt: new Date(i.dueAt), status: LoanItemStatus.ON_LOAN, returnedAt: null, returnCondition: null, overdueDays: 0, renewalCount: 0 })) });
  }
  static restore(x: LoanSnapshot) { return new Loan({ ...x, borrowedAt: new Date(x.borrowedAt), items: x.items.map(i => ({ ...i, dueAt: new Date(i.dueAt), returnedAt: i.returnedAt ? new Date(i.returnedAt) : null })) }); }
  get id() { return this.state.id; } get readerId() { return this.state.readerId; } get cardId() { return this.state.cardId; }
  get branchId() { return this.state.branchId; } get staffId() { return this.state.staffId; } get borrowedAt() { return new Date(this.state.borrowedAt); }
  get status() { return this.state.status; } get items() { return this.state.items.map(i => ({ ...i, dueAt: new Date(i.dueAt), returnedAt: i.returnedAt ? new Date(i.returnedAt) : null })); }
  returnItems(returns: Array<{ itemId: string; condition: ReturnCondition }>, now: Date) {
    for (const returned of returns) {
      const item = this.state.items.find(i => i.id === returned.itemId); if (!item) throw new CirculationDomainError(`Loan item ${returned.itemId} was not found`);
      if (item.status !== LoanItemStatus.ON_LOAN) throw new CirculationDomainError("Loan item has already been returned");
      item.returnedAt = new Date(now); item.returnCondition = returned.condition;
      item.overdueDays = Math.max(0, Math.ceil((now.getTime() - item.dueAt.getTime()) / 86_400_000));
      item.status = returned.condition === ReturnCondition.LOST ? LoanItemStatus.LOST : LoanItemStatus.RETURNED;
    }
    if (this.state.items.every(i => i.status !== LoanItemStatus.ON_LOAN)) this.state.status = LoanStatus.CLOSED;
  }
  renewItems(itemIds: string[], now: Date, days: number, maxRenewals: number, reservedTitleIds: Set<string>) {
    if (!itemIds.length) throw new CirculationDomainError("At least one loan item is required");
    for (const id of itemIds) {
      const item = this.state.items.find(i => i.id === id); if (!item) throw new CirculationDomainError(`Loan item ${id} was not found`);
      if (item.status !== LoanItemStatus.ON_LOAN) throw new CirculationDomainError("Returned loan item cannot be renewed");
      if (item.dueAt < now) throw new CirculationDomainError("Overdue loan item cannot be renewed");
      if (item.renewalCount >= maxRenewals) throw new CirculationDomainError("Loan item reached renewal limit");
      if (reservedTitleIds.has(item.bookTitleId)) throw new CirculationDomainError("Book title is reserved by another reader");
      item.dueAt = new Date(item.dueAt.getTime() + days * 86_400_000); item.renewalCount += 1;
    }
  }
  toSnapshot(): LoanSnapshot { return { ...this.state, borrowedAt: new Date(this.state.borrowedAt), items: this.items }; }
}
