export enum PaymentMethod { CASH = "CASH", ONLINE = "ONLINE" }
export enum PaymentStatus { PENDING = "PENDING", SUCCEEDED = "SUCCEEDED", FAILED = "FAILED" }
export interface PaymentSnapshot { id: string; readerId: string; fineIds: string[]; totalAmount: number; method: PaymentMethod; status: PaymentStatus; providerReference: string | null; createdAt: Date; completedAt: Date | null; }

export class PaymentTransaction {
  private constructor(private state: PaymentSnapshot) {}
  static createCash(input: Omit<PaymentSnapshot, "method" | "status" | "providerReference" | "completedAt">) {
    this.validate(input.fineIds, input.totalAmount);
    return new PaymentTransaction({ ...input, method: PaymentMethod.CASH, status: PaymentStatus.SUCCEEDED, providerReference: null, completedAt: input.createdAt });
  }
  static createOnline(input: Omit<PaymentSnapshot, "method" | "status" | "completedAt">) {
    this.validate(input.fineIds, input.totalAmount);
    return new PaymentTransaction({ ...input, method: PaymentMethod.ONLINE, status: PaymentStatus.PENDING, completedAt: null });
  }
  static restore(value: PaymentSnapshot) { return new PaymentTransaction({ ...value, fineIds: [...value.fineIds], createdAt: new Date(value.createdAt), completedAt: value.completedAt ? new Date(value.completedAt) : null }); }
  private static validate(fineIds: string[], amount: number) {
    if (!fineIds.length || new Set(fineIds).size !== fineIds.length) throw new Error("Unique fine IDs are required");
    if (!Number.isInteger(amount) || amount <= 0) throw new Error("Payment amount must be a positive integer");
  }
  get id() { return this.state.id; } get readerId() { return this.state.readerId; } get status() { return this.state.status; }
  get method() { return this.state.method; } get fineIds() { return [...this.state.fineIds]; } get totalAmount() { return this.state.totalAmount; }
  confirm(result: PaymentStatus.SUCCEEDED | PaymentStatus.FAILED, at: Date) {
    if (this.state.status === result) return;
    if (this.state.status !== PaymentStatus.PENDING) throw new Error("Payment already has a terminal result");
    this.state.status = result; this.state.completedAt = at;
  }
  toSnapshot(): PaymentSnapshot { return { ...this.state, fineIds: [...this.state.fineIds], createdAt: new Date(this.state.createdAt), completedAt: this.state.completedAt ? new Date(this.state.completedAt) : null }; }
}
