export enum FineReason { OVERDUE = "OVERDUE", DAMAGED = "DAMAGED", LOST = "LOST" }
export enum FineStatus { UNPAID = "UNPAID", PAID = "PAID", WAIVED = "WAIVED" }

export interface FineSnapshot {
  id: string; readerId: string; loanId: string; loanItemId: string; reason: FineReason;
  amount: number; status: FineStatus; pendingPaymentId: string | null; createdAt: Date; paidAt: Date | null;
}

export class Fine {
  private constructor(private state: FineSnapshot) {}
  static create(input: Omit<FineSnapshot, "status" | "pendingPaymentId" | "paidAt">) {
    if (!Number.isInteger(input.amount) || input.amount <= 0) throw new Error("Fine amount must be a positive integer");
    return new Fine({ ...input, status: FineStatus.UNPAID, pendingPaymentId: null, paidAt: null });
  }
  static restore(value: FineSnapshot) { return new Fine({ ...value, createdAt: new Date(value.createdAt), paidAt: value.paidAt ? new Date(value.paidAt) : null }); }
  get id() { return this.state.id; } get readerId() { return this.state.readerId; } get status() { return this.state.status; }
  get amount() { return this.state.amount; } get pendingPaymentId() { return this.state.pendingPaymentId; }
  reserveForPayment(paymentId: string) {
    if (this.state.status !== FineStatus.UNPAID || this.state.pendingPaymentId) throw new Error("Fine is not available for payment");
    this.state.pendingPaymentId = paymentId;
  }
  releasePayment(paymentId: string) {
    if (this.state.status !== FineStatus.UNPAID || this.state.pendingPaymentId !== paymentId) throw new Error("Fine is not reserved by this payment");
    this.state.pendingPaymentId = null;
  }
  markPaid(paymentId: string, paidAt = new Date()) {
    if (this.state.status !== FineStatus.UNPAID || this.state.pendingPaymentId !== paymentId) throw new Error("Fine cannot be paid by this payment");
    this.state.status = FineStatus.PAID; this.state.pendingPaymentId = null; this.state.paidAt = paidAt;
  }
  toSnapshot(): FineSnapshot { return { ...this.state, createdAt: new Date(this.state.createdAt), paidAt: this.state.paidAt ? new Date(this.state.paidAt) : null }; }
}
