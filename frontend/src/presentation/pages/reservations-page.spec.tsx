import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Reservation } from "../../domain/reservation";
import { createTestServices } from "../../test/fakes";
import { ServicesProvider } from "../app/services-context";
import { ReservationsPage } from "./reservations-page";

const readerId = "550e8400-e29b-41d4-a716-446655440000";
const reservationId = "123e4567-e89b-42d3-a456-426614174000";
const reservation: Reservation = {
  id: reservationId, readerId, bookTitleId: "title-1", branchId: "branch-1", status: "WAITING",
  copyId: null, holdExpiresAt: null, createdAt: "2026-07-04T00:00:00.000Z", cancelReason: null,
};

describe("ReservationsPage", () => {
  it("looks up and cancels an active reservation", async () => {
    const services = createTestServices();
    vi.mocked(services.listReservations.execute).mockResolvedValue([reservation]);
    vi.mocked(services.cancelReservation.execute).mockResolvedValue({
      ...reservation, status: "CANCELLED", cancelReason: "Độc giả yêu cầu hủy",
    });
    render(<ServicesProvider services={services}><ReservationsPage /></ServicesProvider>);

    await userEvent.type(screen.getByLabelText("ID độc giả"), readerId);
    await userEvent.click(screen.getByRole("button", { name: "Tra cứu đặt chỗ" }));
    expect(await screen.findByText(reservationId)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: `Hủy ${reservationId}` }));
    await userEvent.type(screen.getByLabelText("Lý do hủy"), "Độc giả yêu cầu hủy");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận hủy" }));

    expect(services.cancelReservation.execute).toHaveBeenCalledWith(reservationId, "Độc giả yêu cầu hủy");
    expect(await screen.findByText("Độc giả yêu cầu hủy")).toBeInTheDocument();
  });

  it("reports when allocation has no matching queue or copy", async () => {
    const services = createTestServices();
    vi.mocked(services.allocateReservation.execute).mockResolvedValue(null);
    render(<ServicesProvider services={services}><ReservationsPage /></ServicesProvider>);

    await userEvent.type(screen.getByLabelText("ID đầu sách"), "123e4567-e89b-42d3-a456-426614174001");
    await userEvent.type(screen.getByLabelText("ID chi nhánh"), "123e4567-e89b-42d3-a456-426614174002");
    await userEvent.click(screen.getByRole("button", { name: "Phân bổ bản sao" }));

    expect(await screen.findByText("Không có yêu cầu hoặc bản sao phù hợp")).toBeInTheDocument();
  });
});
