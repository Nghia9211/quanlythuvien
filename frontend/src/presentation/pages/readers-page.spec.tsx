import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Reader } from "../../domain/reader";
import { createTestServices } from "../../test/fakes";
import { ServicesProvider } from "../app/services-context";
import { ReadersPage } from "./readers-page";

const readerId = "550e8400-e29b-41d4-a716-446655440000";
const reader: Reader = {
  id: readerId,
  fullName: "Nguyễn An",
  dateOfBirth: "2000-01-02",
  email: "an@example.com",
  phone: "0901234567",
  identityNumber: "ABC12345",
  address: "Hà Nội",
  status: "ACTIVE",
  card: {
    id: "card-1", cardNumber: "CARD001", status: "ACTIVE",
    issuedAt: "2026-01-01T00:00:00.000Z", expiresAt: "2027-01-01T00:00:00.000Z", lockReason: null,
  },
};

describe("ReadersPage", () => {
  it("looks up a reader and locks their card with a reason", async () => {
    const services = createTestServices();
    vi.mocked(services.getReader.execute).mockResolvedValue(reader);
    vi.mocked(services.changeCardStatus.execute).mockResolvedValue({
      ...reader, card: { ...reader.card, status: "LOCKED", lockReason: "Thẻ bị thất lạc" },
    });
    render(<ServicesProvider services={services}><ReadersPage /></ServicesProvider>);

    await userEvent.type(screen.getByLabelText("ID độc giả"), readerId);
    await userEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    expect(await screen.findByText("Nguyễn An")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Khóa thẻ" }));
    await userEvent.type(screen.getByLabelText("Lý do"), "Thẻ bị thất lạc");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận khóa" }));
    expect(services.changeCardStatus.execute).toHaveBeenCalledWith(readerId, "LOCK", "Thẻ bị thất lạc");
    expect(await screen.findByText("Thẻ bị thất lạc")).toBeInTheDocument();
  });

  it("registers a reader and displays the issued card", async () => {
    const services = createTestServices();
    vi.mocked(services.registerReader.execute).mockResolvedValue(reader);
    render(<ServicesProvider services={services}><ReadersPage /></ServicesProvider>);

    await userEvent.click(screen.getByRole("button", { name: "Đăng ký mới" }));
    await userEvent.type(screen.getByLabelText("Họ và tên"), "Nguyễn An");
    await userEvent.type(screen.getByLabelText("Ngày sinh"), "2000-01-02");
    await userEvent.type(screen.getByLabelText("Email"), "an@example.com");
    await userEvent.type(screen.getByLabelText("Số giấy tờ"), "ABC12345");
    await userEvent.type(screen.getByLabelText("Tên đăng nhập mới"), "nguyenan");
    await userEvent.type(screen.getByLabelText("Mật khẩu ban đầu"), "password1");
    await userEvent.click(screen.getByRole("button", { name: "Đăng ký độc giả" }));

    expect(services.registerReader.execute).toHaveBeenCalledWith(expect.objectContaining({
      fullName: "Nguyễn An", email: "an@example.com", username: "nguyenan",
    }));
    expect(await screen.findByText("CARD001")).toBeInTheDocument();
  });
});
