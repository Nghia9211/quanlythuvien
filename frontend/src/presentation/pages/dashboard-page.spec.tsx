import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestServices } from "../../test/fakes";
import { ServicesProvider } from "../app/services-context";
import { DashboardPage } from "./dashboard-page";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-07-04T12:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("loads and displays all operational metrics", async () => {
    const services = createTestServices();
    vi.mocked(services.getOperationalReport.execute).mockResolvedValue({
      loans: 12, overdueItems: 3, availableCopies: 45,
      unpaidFineAmount: 125000, completedInventories: 2,
    });

    render(<ServicesProvider services={services}><DashboardPage /></ServicesProvider>);

    expect(screen.getByText("Đang tải báo cáo…")).toBeInTheDocument();
    expect(await screen.findByText("Lượt mượn")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Sách đang quá hạn")).toBeInTheDocument();
    expect(screen.getByText("Bản sao sẵn sàng")).toBeInTheDocument();
    expect(screen.getByText("Kiểm kê hoàn tất")).toBeInTheDocument();
    expect(services.getOperationalReport.execute).toHaveBeenCalledWith({
      from: "2026-07-01", to: "2026-07-31",
    });
  });

  it("retries the same request after failure", async () => {
    const services = createTestServices();
    vi.mocked(services.getOperationalReport.execute)
      .mockRejectedValueOnce(new Error("Mất kết nối"))
      .mockResolvedValueOnce({ loans: 1, overdueItems: 0, availableCopies: 2, unpaidFineAmount: 0, completedInventories: 0 });
    render(<ServicesProvider services={services}><DashboardPage /></ServicesProvider>);

    expect(await screen.findByRole("alert")).toHaveTextContent("Mất kết nối");
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Lượt mượn")).toBeInTheDocument();
    expect(services.getOperationalReport.execute).toHaveBeenCalledTimes(2);
  });
});
