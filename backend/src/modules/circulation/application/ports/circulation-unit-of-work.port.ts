import { Loan, LoanItemSnapshot } from "../../domain/entities/loan";
export interface ReaderEligibility { readerId: string; cardId: string; cardNumber: string; readerStatus: string; cardStatus: string; cardExpiresAt: Date; }
export interface CirculationCopy { id: string; bookTitleId: string; barcode: string; branchId: string; status: string; }
export interface LoanPolicy { id: string; maxActiveItems: number; loanDays: number; maxRenewals: number; renewalDays: number; }
export interface OpenLoanItemRecord { loan: Loan; item: LoanItemSnapshot; copy: CirculationCopy; }
export interface CirculationAuditEvent { actorId: string; action: string; aggregateId: string; details?: Record<string, unknown>; }
export interface CirculationTransaction {
  findReaderByCard(card: string): Promise<ReaderEligibility | null>; countActiveItems(readerId: string): Promise<number>;
  findCopiesByBarcodes(values: string[]): Promise<CirculationCopy[]>; saveCopies(values: CirculationCopy[]): Promise<void>;
  findOpenItemsByBarcodes(values: string[]): Promise<OpenLoanItemRecord[]>; findLoanById(id: string): Promise<Loan | null>;
  saveLoan(value: Loan): Promise<void>; findLoansByReader(readerId: string): Promise<Loan[]>; getActivePolicy(): Promise<LoanPolicy>;
  appendAudit(event: CirculationAuditEvent): Promise<void>;
  isCopyHeldForReader(copyId: string, readerId: string): Promise<boolean>;
  completeHeldReservations(copyIds: string[], readerId: string): Promise<void>;
}
export interface CirculationUnitOfWork { execute<T>(work: (tx: CirculationTransaction) => Promise<T>): Promise<T>; }
