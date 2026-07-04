import type { BorrowBooksInput, Loan, ReturnLine, ReturnResult } from "../../domain/circulation";
import type { Reader, RegisterReaderInput, UpdateReaderInput } from "../../domain/reader";
import type { ReportFilter, OperationalReport } from "../../domain/report";
import type { AllocateReservationInput, Reservation } from "../../domain/reservation";

export interface ReportingGateway {
  getOperationalReport(filter: ReportFilter): Promise<OperationalReport>;
}

export interface ReadersGateway {
  register(input: RegisterReaderInput): Promise<Reader>;
  get(readerId: string): Promise<Reader>;
  update(readerId: string, input: UpdateReaderInput): Promise<Reader>;
  renew(readerId: string, validityMonths?: number): Promise<Reader>;
  changeCardStatus(readerId: string, action: "LOCK" | "UNLOCK", reason: string): Promise<Reader>;
}

export interface CirculationGateway {
  borrow(input: BorrowBooksInput): Promise<Loan>;
  returnBooks(returns: ReturnLine[]): Promise<ReturnResult[]>;
  listReaderLoans(readerId: string): Promise<Loan[]>;
}

export interface ReservationsGateway {
  listByReader(readerId: string): Promise<Reservation[]>;
  cancel(reservationId: string, reason: string): Promise<Reservation>;
  allocate(input: AllocateReservationInput): Promise<Reservation | null>;
}
