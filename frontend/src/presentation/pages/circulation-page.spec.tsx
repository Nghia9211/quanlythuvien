import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Loan } from "../../domain/circulation";
import { createTestServices } from "../../test/fakes";
import { ServicesProvider } from "../app/services-context";
import { CirculationPage } from "./circulation-page";

const loan: Loan = {
  id: "loan-1", readerId: "550e8400-e29b-41d4-a716-446655440000", cardId: "card-1",
  branchId: "branch-1", staffId: "staff-1", borrowedAt: "2026-07-04T00:00:00.000Z", status: "OPEN",
  items: [{
    id: "item-1", copyId: "copy-1", bookTitleId: "title-1", dueAt: "2026-07-18T00:00:00.000Z",
    status: "ON_LOAN", returnedAt: null, returnCondition: null, overdueDays: 0, renewalCount: 0,
  }],
};

describe("CirculationPage", () => {
  it("borrows multiple copies and displays the created loan", async () => {
    const services = createTestServices();
    vi.mocked(services.borrowBooks.execute).mockResolvedValue(loan);
    render(<ServicesProvider services={services}><CirculationPage /></ServicesProvider>);

    await userEvent.type(screen.getByLabelText("Số thẻ"), "card001");
    await userEvent.type(screen.getByLabelText("Mã bản sao"), "copy01{enter}copy02");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận mượn" }));

    expect(services.borrowBooks.execute).toHaveBeenCalledWith({
      cardNumber: "card001", barcodes: ["copy01", "copy02"],
    });
    expect(await screen.findByText("Tạo khoản mượn thành công")).toBeInTheDocument();
    expect(screen.getByText("loan-1")).toBeInTheDocument();
  });

  it("returns a copy with its selected condition", async () => {
    const services = createTestServices();
    vi.mocked(services.returnBooks.execute).mockResolvedValue([{ barcode: "COPY01", condition: "DAMAGED", overdueDays: 2 }]);
    render(<ServicesProvider services={services}><CirculationPage /></ServicesProvider>);

    await userEvent.click(screen.getByRole("button", { name: "Trả sách" }));
    await userEvent.type(screen.getByLabelText("Mã bản sao trả 1"), "copy01");
    await userEvent.selectOptions(screen.getByLabelText("Tình trạng trả 1"), "DAMAGED");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận trả" }));

    expect(services.returnBooks.execute).toHaveBeenCalledWith([{ barcode: "copy01", condition: "DAMAGED" }]);
    expect(await screen.findByText("Quá hạn 2 ngày")).toBeInTheDocument();
  });
});
