import type { BorrowBooksInput, Loan, ReturnCondition, ReturnLine, ReturnResult } from "../../domain/circulation";
import type { Reader, RegisterReaderInput, UpdateReaderInput } from "../../domain/reader";
import type { OperationalReport, ReportFilter } from "../../domain/report";
import type { AllocateReservationInput, Reservation } from "../../domain/reservation";
import { isUuid, ValidationError } from "../errors";
import type { CirculationGateway, ReadersGateway, ReportingGateway, ReservationsGateway } from "../ports/library.gateways";

const requireUuid = (value: string, message: string) => {
  const normalized = value.trim();
  if (!isUuid(normalized)) throw new ValidationError(message);
  return normalized;
};

export class GetOperationalReportUseCase {
  constructor(private readonly reports: ReportingGateway) {}
  async execute(filter: ReportFilter): Promise<OperationalReport> {
    const from = new Date(filter.from);
    const to = new Date(filter.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      throw new ValidationError("Khoảng ngày báo cáo không hợp lệ");
    }
    return this.reports.getOperationalReport(filter);
  }
}

export class RegisterReaderUseCase {
  constructor(private readonly readers: ReadersGateway) {}
  async execute(input: RegisterReaderInput): Promise<Reader> {
    const valid = input.fullName.trim().length > 0
      && /^\S+@\S+\.\S+$/.test(input.email)
      && input.username.trim().length >= 3
      && input.initialPassword.length >= 8
      && /^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth)
      && input.identityNumber.trim().length >= 6;
    if (!valid) throw new ValidationError("Thông tin đăng ký độc giả chưa hợp lệ");
    return this.readers.register({ ...input, fullName: input.fullName.trim(), username: input.username.trim().toLowerCase() });
  }
}

export class GetReaderUseCase {
  constructor(private readonly readers: ReadersGateway) {}
  async execute(readerId: string): Promise<Reader> {
    return this.readers.get(requireUuid(readerId, "ID độc giả phải là UUID hợp lệ"));
  }
}

export class UpdateReaderUseCase {
  constructor(private readonly readers: ReadersGateway) {}
  async execute(readerId: string, input: UpdateReaderInput): Promise<Reader> {
    return this.readers.update(requireUuid(readerId, "ID độc giả phải là UUID hợp lệ"), input);
  }
}

export class RenewReaderCardUseCase {
  constructor(private readonly readers: ReadersGateway) {}
  async execute(readerId: string, validityMonths?: number): Promise<Reader> {
    const id = requireUuid(readerId, "ID độc giả phải là UUID hợp lệ");
    if (validityMonths !== undefined && (!Number.isInteger(validityMonths) || validityMonths < 1 || validityMonths > 60)) {
      throw new ValidationError("Thời hạn thẻ phải từ 1 đến 60 tháng");
    }
    return this.readers.renew(id, validityMonths);
  }
}

export class ChangeCardStatusUseCase {
  constructor(private readonly readers: ReadersGateway) {}
  async execute(readerId: string, action: "LOCK" | "UNLOCK", reason: string): Promise<Reader> {
    const normalizedReason = reason.trim();
    if (!normalizedReason) throw new ValidationError("Lý do thay đổi trạng thái là bắt buộc");
    return this.readers.changeCardStatus(
      requireUuid(readerId, "ID độc giả phải là UUID hợp lệ"),
      action,
      normalizedReason,
    );
  }
}

export class BorrowBooksUseCase {
  constructor(private readonly circulation: CirculationGateway) {}
  async execute(input: BorrowBooksInput): Promise<Loan> {
    const cardNumber = input.cardNumber.trim().toUpperCase();
    const barcodes = input.barcodes.map((barcode) => barcode.trim().toUpperCase()).filter(Boolean);
    if (!cardNumber) throw new ValidationError("Số thẻ là bắt buộc");
    if (!barcodes.length) throw new ValidationError("Nhập ít nhất một mã bản sao");
    if (new Set(barcodes).size !== barcodes.length) throw new ValidationError("Mã bản sao không được trùng");
    return this.circulation.borrow({ cardNumber, barcodes });
  }
}

export class ReturnBooksUseCase {
  constructor(private readonly circulation: CirculationGateway) {}
  async execute(lines: ReturnLine[]): Promise<ReturnResult[]> {
    if (!lines.length) throw new ValidationError("Nhập ít nhất một sách cần trả");
    const conditions: ReturnCondition[] = ["NORMAL", "DAMAGED", "LOST"];
    if (lines.some((line) => !conditions.includes(line.condition))) {
      throw new ValidationError("Tình trạng trả sách không hợp lệ");
    }
    const normalized = lines.map((line) => ({ ...line, barcode: line.barcode.trim().toUpperCase() }));
    if (normalized.some((line) => !line.barcode) || new Set(normalized.map((line) => line.barcode)).size !== normalized.length) {
      throw new ValidationError("Mã bản sao trả sách phải đầy đủ và không trùng");
    }
    return this.circulation.returnBooks(normalized);
  }
}

export class ListReaderLoansUseCase {
  constructor(private readonly circulation: CirculationGateway) {}
  async execute(readerId: string): Promise<Loan[]> {
    return this.circulation.listReaderLoans(requireUuid(readerId, "ID độc giả phải là UUID hợp lệ"));
  }
}

export class ListReservationsUseCase {
  constructor(private readonly reservations: ReservationsGateway) {}
  async execute(readerId: string): Promise<Reservation[]> {
    return this.reservations.listByReader(requireUuid(readerId, "ID độc giả phải là UUID hợp lệ"));
  }
}

export class CancelReservationUseCase {
  constructor(private readonly reservations: ReservationsGateway) {}
  async execute(reservationId: string, reason: string): Promise<Reservation> {
    const normalizedReason = reason.trim();
    if (!normalizedReason) throw new ValidationError("Lý do hủy là bắt buộc");
    return this.reservations.cancel(
      requireUuid(reservationId, "ID đặt chỗ phải là UUID hợp lệ"),
      normalizedReason,
    );
  }
}

export class AllocateReservationUseCase {
  constructor(private readonly reservations: ReservationsGateway) {}
  async execute(input: AllocateReservationInput): Promise<Reservation | null> {
    if (!isUuid(input.bookTitleId) || !isUuid(input.branchId)) {
      throw new ValidationError("ID đầu sách và chi nhánh phải là UUID hợp lệ");
    }
    return this.reservations.allocate({
      bookTitleId: input.bookTitleId.trim(),
      branchId: input.branchId.trim(),
    });
  }
}
