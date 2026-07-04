import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CirculationGateway,
  ReadersGateway,
  ReportingGateway,
  ReservationsGateway,
} from "../ports/library.gateways";
import {
  AllocateReservationUseCase,
  BorrowBooksUseCase,
  CancelReservationUseCase,
  GetOperationalReportUseCase,
  GetReaderUseCase,
  RegisterReaderUseCase,
  ReturnBooksUseCase,
} from "./library.use-cases";

describe("library application use cases", () => {
  let reports: ReportingGateway;
  let readers: ReadersGateway;
  let circulation: CirculationGateway;
  let reservations: ReservationsGateway;

  beforeEach(() => {
    reports = { getOperationalReport: vi.fn() };
    readers = {
      register: vi.fn(), get: vi.fn(), update: vi.fn(), renew: vi.fn(), changeCardStatus: vi.fn(),
    };
    circulation = { borrow: vi.fn(), returnBooks: vi.fn(), listReaderLoans: vi.fn() };
    reservations = { listByReader: vi.fn(), cancel: vi.fn(), allocate: vi.fn() };
  });

  it("rejects an invalid operational report date range", async () => {
    await expect(new GetOperationalReportUseCase(reports).execute({
      from: "2026-07-31",
      to: "2026-07-01",
    })).rejects.toMatchObject({ message: "Khoảng ngày báo cáo không hợp lệ" });
    expect(reports.getOperationalReport).not.toHaveBeenCalled();
  });

  it("rejects a malformed reader id before lookup", async () => {
    await expect(new GetReaderUseCase(readers).execute("reader-1"))
      .rejects.toMatchObject({ message: "ID độc giả phải là UUID hợp lệ" });
    expect(readers.get).not.toHaveBeenCalled();
  });

  it("validates required reader registration fields", async () => {
    await expect(new RegisterReaderUseCase(readers).execute({
      fullName: "",
      dateOfBirth: "2000-01-01",
      email: "invalid",
      identityNumber: "ABC123",
      username: "ab",
      initialPassword: "short",
    })).rejects.toMatchObject({ message: "Thông tin đăng ký độc giả chưa hợp lệ" });
    expect(readers.register).not.toHaveBeenCalled();
  });

  it("normalizes unique card and copy barcodes for borrowing", async () => {
    vi.mocked(circulation.borrow).mockResolvedValue({
      id: "loan-1", readerId: "reader-1", cardId: "card-1", branchId: "branch-1",
      staffId: "staff-1", borrowedAt: "2026-07-04T00:00:00.000Z", status: "OPEN", items: [],
    });

    await new BorrowBooksUseCase(circulation).execute({
      cardNumber: " card001 ",
      barcodes: [" copy01 ", "COPY02"],
    });

    expect(circulation.borrow).toHaveBeenCalledWith({
      cardNumber: "CARD001",
      barcodes: ["COPY01", "COPY02"],
    });
  });

  it("rejects missing and duplicate copy barcodes", async () => {
    const useCase = new BorrowBooksUseCase(circulation);
    await expect(useCase.execute({ cardNumber: "CARD001", barcodes: [] }))
      .rejects.toMatchObject({ message: "Nhập ít nhất một mã bản sao" });
    await expect(useCase.execute({ cardNumber: "CARD001", barcodes: ["copy01", "COPY01"] }))
      .rejects.toMatchObject({ message: "Mã bản sao không được trùng" });
    expect(circulation.borrow).not.toHaveBeenCalled();
  });

  it("rejects an invalid return condition", async () => {
    await expect(new ReturnBooksUseCase(circulation).execute([
      { barcode: "COPY01", condition: "BROKEN" as never },
    ])).rejects.toMatchObject({ message: "Tình trạng trả sách không hợp lệ" });
    expect(circulation.returnBooks).not.toHaveBeenCalled();
  });

  it("requires a staff cancellation reason", async () => {
    await expect(new CancelReservationUseCase(reservations).execute(
      "550e8400-e29b-41d4-a716-446655440000",
      " ",
    )).rejects.toMatchObject({ message: "Lý do hủy là bắt buộc" });
    expect(reservations.cancel).not.toHaveBeenCalled();
  });

  it("validates both allocation UUID values", async () => {
    await expect(new AllocateReservationUseCase(reservations).execute({
      bookTitleId: "bad",
      branchId: "bad",
    })).rejects.toMatchObject({ message: "ID đầu sách và chi nhánh phải là UUID hợp lệ" });
    expect(reservations.allocate).not.toHaveBeenCalled();
  });
});
