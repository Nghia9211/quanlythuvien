export interface OperationalReport {
  loans: number;
  overdueItems: number;
  availableCopies: number;
  unpaidFineAmount: number;
  completedInventories: number;
}

export interface ReportFilter {
  from: string;
  to: string;
  branchId?: string;
}
