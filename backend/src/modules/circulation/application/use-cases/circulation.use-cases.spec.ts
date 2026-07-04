import { Loan } from "../../domain/entities/loan";
import { ReturnCondition } from "../../domain/enums/return-condition.enum";
import { CirculationTransaction, CirculationUnitOfWork, CirculationCopy, ReaderEligibility, LoanPolicy, CirculationAuditEvent } from "../ports/circulation-unit-of-work.port";
import { CirculationIdentifierGenerator, Clock, FineAssessmentPort, ReservationEligibilityPort } from "../ports/circulation.ports";
import { BorrowBooksUseCase, ListReaderLoansUseCase, RenewLoanUseCase, ReturnBooksUseCase } from "./circulation.use-cases";
import { CirculationError } from "../errors/circulation.error";

class MemoryCirculation implements CirculationUnitOfWork, CirculationTransaction {
  reader: ReaderEligibility = { readerId: "reader-1", cardId: "card-1", cardNumber: "CARD-1", readerStatus: "ACTIVE", cardStatus: "ACTIVE", cardExpiresAt: new Date("2027-01-01") };
  copies = new Map<string, CirculationCopy>([["BC-1", { id: "copy-1", bookTitleId: "title-1", barcode: "BC-1", branchId: "branch-1", status: "AVAILABLE" }], ["BC-2", { id: "copy-2", bookTitleId: "title-2", barcode: "BC-2", branchId: "branch-1", status: "AVAILABLE" }]]);
  loans = new Map<string, Loan>(); audits: CirculationAuditEvent[] = [];
  heldCopies = new Map<string, string>(); completedReservations: string[] = [];
  policy: LoanPolicy = { id: "policy-1", maxActiveItems: 5, loanDays: 14, maxRenewals: 2, renewalDays: 14 };
  execute<T>(work: (tx: CirculationTransaction) => Promise<T>) { return work(this); }
  findReaderByCard(card: string) { return Promise.resolve(card === this.reader.cardNumber ? this.reader : null); }
  countActiveItems() { return Promise.resolve([...this.loans.values()].flatMap(x => x.items).filter(x => !x.returnedAt).length); }
  findCopiesByBarcodes(values: string[]) { return Promise.resolve(values.map(x => this.copies.get(x)).filter(Boolean) as CirculationCopy[]); }
  saveCopies(values: CirculationCopy[]) { values.forEach(x => this.copies.set(x.barcode, x)); return Promise.resolve(); }
  findOpenItemsByBarcodes(values: string[]) { return Promise.resolve([...this.loans.values()].flatMap(loan => loan.items.filter(x => !x.returnedAt).map(item => ({ loan, item, copy: [...this.copies.values()].find(c => c.id === item.copyId)! }))).filter(x => values.includes(x.copy.barcode))); }
  findLoanById(id: string) { return Promise.resolve(this.loans.get(id) ?? null); }
  saveLoan(value: Loan) { this.loans.set(value.id, value); return Promise.resolve(); }
  findLoansByReader(readerId: string) { return Promise.resolve([...this.loans.values()].filter(x => x.readerId === readerId)); }
  getActivePolicy() { return Promise.resolve(this.policy); }
  appendAudit(x: CirculationAuditEvent) { this.audits.push(x); return Promise.resolve(); }
  isCopyHeldForReader(copyId: string, readerId: string) { return Promise.resolve(this.heldCopies.get(copyId) === readerId); }
  completeHeldReservations(copyIds: string[], readerId: string) { this.completedReservations.push(...copyIds.filter(id => this.heldCopies.get(id) === readerId)); return Promise.resolve(); }
}
class Ids implements CirculationIdentifierGenerator { private i = 0; next() { return ["loan-1", "item-1", "item-2"][this.i++]; } }
class FixedClock implements Clock { now() { return new Date("2026-07-01T00:00:00Z"); } }
class Reservations implements ReservationEligibilityPort { constructor(private reserved = new Set<string>()) {} hasWaitingReservation(titleId: string) { return Promise.resolve(this.reserved.has(titleId)); } }
class FineAssessment implements FineAssessmentPort { calls:string[]=[];assess(input:{loanItemId:string}){this.calls.push(input.loanItemId);return Promise.resolve();} }

describe("Circulation use cases", () => {
  it("borrows available copies atomically and enforces limits", async () => {
    const store = new MemoryCirculation(); const borrow = new BorrowBooksUseCase(store, new Ids(), new FixedClock());
    const result = await borrow.execute({ actorId: "staff-1", cardNumber: "card-1", barcodes: ["bc-1", "bc-2"] });
    expect(result.items).toHaveLength(2); expect(store.copies.get("BC-1")?.status).toBe("ON_LOAN");
    store.policy.maxActiveItems = 2;
    await expect(borrow.execute({ actorId: "staff", cardNumber: "CARD-1", barcodes: ["BC-1"] })).rejects.toBeInstanceOf(CirculationError);
  });

  it("returns books partially and records damaged status", async () => {
    const store = new MemoryCirculation(); await new BorrowBooksUseCase(store, new Ids(), new FixedClock()).execute({ actorId: "staff", cardNumber: "CARD-1", barcodes: ["BC-1", "BC-2"] });
    const result = await new ReturnBooksUseCase(store, { now: () => new Date("2026-07-17T00:00:00Z") }).execute({ actorId: "staff", returns: [{ barcode: "BC-1", condition: ReturnCondition.DAMAGED }] });
    expect(result[0].overdueDays).toBe(2); expect(store.copies.get("BC-1")?.status).toBe("DAMAGED"); expect(store.loans.get("loan-1")?.status).toBe("OPEN");
  });
  it("requests idempotent fine assessment after a return commits", async () => {
    const store=new MemoryCirculation();await new BorrowBooksUseCase(store,new Ids(),new FixedClock()).execute({actorId:"staff",cardNumber:"CARD-1",barcodes:["BC-1"]});const fines=new FineAssessment();
    await new ReturnBooksUseCase(store,{now:()=>new Date("2026-07-17T00:00:00Z")},fines).execute({actorId:"staff",returns:[{barcode:"BC-1",condition:ReturnCondition.DAMAGED}]});expect(fines.calls).toEqual(["item-1"]);
  });

  it("renews only when no title is reserved and lists reader history", async () => {
    const store = new MemoryCirculation(); await new BorrowBooksUseCase(store, new Ids(), new FixedClock()).execute({ actorId: "staff", cardNumber: "CARD-1", barcodes: ["BC-1"] });
    const renew = new RenewLoanUseCase(store, new Reservations(), { now: () => new Date("2026-07-10T00:00:00Z") });
    const result = await renew.execute({ actorId: "staff", loanId: "loan-1", itemIds: ["item-1"] });
    expect(result.items[0].renewalCount).toBe(1);
    await expect(new RenewLoanUseCase(store, new Reservations(new Set(["title-1"])), new FixedClock()).execute({ actorId: "staff", loanId: "loan-1", itemIds: ["item-1"] })).rejects.toBeInstanceOf(CirculationError);
    await expect(new ListReaderLoansUseCase(store).execute("missing")).resolves.toEqual([]);
  });

  it("prevents a reader from renewing or listing another reader's loans", async () => {
    const store = new MemoryCirculation(); await new BorrowBooksUseCase(store, new Ids(), new FixedClock()).execute({ actorId: "staff", cardNumber: "CARD-1", barcodes: ["BC-1"] });
    await expect(new RenewLoanUseCase(store, new Reservations(), new FixedClock()).execute({ actorId: "account-2", requesterReaderId: "reader-2", loanId: "loan-1" })).rejects.toThrow("not owned");
    await expect(new ListReaderLoansUseCase(store).execute("reader-1", "reader-2")).rejects.toThrow("not allowed");
  });

  it("borrows an on-hold copy only for its reservation owner and completes the reservation", async () => {
    const store = new MemoryCirculation(); store.copies.get("BC-1")!.status = "ON_HOLD"; store.heldCopies.set("copy-1", "reader-1");
    await new BorrowBooksUseCase(store, new Ids(), new FixedClock()).execute({ actorId: "staff", cardNumber: "CARD-1", barcodes: ["BC-1"] });
    expect(store.completedReservations).toEqual(["copy-1"]);
    const denied = new MemoryCirculation(); denied.copies.get("BC-1")!.status = "ON_HOLD"; denied.heldCopies.set("copy-1", "reader-2");
    await expect(new BorrowBooksUseCase(denied, new Ids(), new FixedClock()).execute({ actorId: "staff", cardNumber: "CARD-1", barcodes: ["BC-1"] })).rejects.toThrow("unavailable");
  });
});
