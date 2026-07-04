import { Loan } from "./loan";
import { ReturnCondition } from "../enums/return-condition.enum";
import { LoanStatus } from "../enums/loan-status.enum";

const borrowedAt = new Date("2026-07-01T00:00:00Z");
const dueAt = new Date("2026-07-15T00:00:00Z");
function loan() { return Loan.create({ id: "loan-1", readerId: "reader-1", cardId: "card-1", branchId: "branch-1", staffId: "staff-1", borrowedAt, items: [
  { id: "item-1", copyId: "copy-1", bookTitleId: "title-1", dueAt },
  { id: "item-2", copyId: "copy-2", bookTitleId: "title-2", dueAt },
] }); }

describe("Loan aggregate", () => {
  it("returns individual items, records overdue facts and closes after all returns", () => {
    const value = loan();
    value.returnItems([{ itemId: "item-1", condition: ReturnCondition.NORMAL }], new Date("2026-07-17T00:00:00Z"));
    expect(value.items[0].overdueDays).toBe(2); expect(value.status).toBe(LoanStatus.OPEN);
    value.returnItems([{ itemId: "item-2", condition: ReturnCondition.DAMAGED }], new Date("2026-07-17T00:00:00Z"));
    expect(value.status).toBe(LoanStatus.CLOSED);
  });

  it("renews eligible items and rejects overdue, reserved, or over-limit items", () => {
    const value = loan();
    value.renewItems(["item-1"], new Date("2026-07-10T00:00:00Z"), 14, 2, new Set());
    expect(value.items[0].dueAt).toEqual(new Date("2026-07-29T00:00:00Z"));
    expect(value.items[0].renewalCount).toBe(1);
    expect(() => value.renewItems(["item-2"], new Date("2026-07-16T00:00:00Z"), 14, 2, new Set())).toThrow("Overdue loan item cannot be renewed");
    expect(() => value.renewItems(["item-2"], new Date("2026-07-10T00:00:00Z"), 14, 2, new Set(["title-2"]))).toThrow("reserved");
  });
});
