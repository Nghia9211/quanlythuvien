import { Fine, FineReason, FineStatus } from "./fine";
import { PaymentMethod, PaymentStatus, PaymentTransaction } from "./payment-transaction";

describe("Billing domain", () => {
  it("reserves and pays a fine exactly once", () => {
    const fine = Fine.create({ id: "fine-1", readerId: "reader-1", loanId: "loan-1", loanItemId: "item-1", reason: FineReason.OVERDUE, amount: 15000, createdAt: new Date() });
    fine.reserveForPayment("payment-1"); fine.markPaid("payment-1");
    expect(fine.status).toBe(FineStatus.PAID); expect(() => fine.markPaid("payment-1")).toThrow();
  });
  it("creates cash as succeeded and confirms online outcomes idempotently", () => {
    const cash = PaymentTransaction.createCash({ id: "cash", readerId: "reader-1", fineIds: ["fine-1"], totalAmount: 5000, createdAt: new Date() });
    expect(cash.status).toBe(PaymentStatus.SUCCEEDED); expect(cash.method).toBe(PaymentMethod.CASH);
    const online = PaymentTransaction.createOnline({ id: "online", readerId: "reader-1", fineIds: ["fine-1"], totalAmount: 5000, providerReference: "SIM-online", createdAt: new Date() });
    online.confirm(PaymentStatus.FAILED, new Date()); online.confirm(PaymentStatus.FAILED, new Date());
    expect(online.status).toBe(PaymentStatus.FAILED); expect(() => online.confirm(PaymentStatus.SUCCEEDED, new Date())).toThrow("terminal");
  });
  it("rejects invalid monetary values and empty fine selections", () => {
    expect(() => Fine.create({ id: "x", readerId: "r", loanId: "l", loanItemId: "i", reason: FineReason.LOST, amount: 0, createdAt: new Date() })).toThrow("positive");
    expect(() => PaymentTransaction.createCash({ id: "p", readerId: "r", fineIds: [], totalAmount: 1, createdAt: new Date() })).toThrow("fine");
  });
});
