export type ReturnCondition = "NORMAL" | "DAMAGED" | "LOST";
export type LoanStatus = "OPEN" | "CLOSED";

export interface LoanItem {
  id: string;
  copyId: string;
  bookTitleId: string;
  dueAt: string;
  status: string;
  returnedAt: string | null;
  returnCondition: ReturnCondition | null;
  overdueDays: number;
  renewalCount: number;
}

export interface Loan {
  id: string;
  readerId: string;
  cardId: string;
  branchId: string;
  staffId: string;
  borrowedAt: string;
  status: LoanStatus;
  items: LoanItem[];
}

export interface BorrowBooksInput {
  cardNumber: string;
  barcodes: string[];
}

export interface ReturnLine {
  barcode: string;
  condition: ReturnCondition;
}

export interface ReturnResult {
  barcode: string;
  condition: ReturnCondition;
  overdueDays: number;
}
