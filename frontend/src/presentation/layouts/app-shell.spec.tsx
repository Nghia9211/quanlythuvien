import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { createTestServices } from "../../test/fakes";
import { AuthProvider } from "../app/auth-context";
import { ServicesProvider } from "../app/services-context";
import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("shows business navigation and signs the current user out", async () => {
    const services = createTestServices();
    vi.mocked(services.restoreSession.execute).mockResolvedValue({
      id: "user-1", readerId: null, username: "staff", role: "STAFF",
    });
    render(
      <MemoryRouter>
        <ServicesProvider services={services}>
          <AuthProvider><AppShell /></AuthProvider>
        </ServicesProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("navigation", { name: "Nghiệp vụ thư viện" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tổng quan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Độc giả" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mượn / trả" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt chỗ" })).toBeInTheDocument();
    expect(screen.getByText("staff · STAFF")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(services.logout.execute).toHaveBeenCalledOnce();
  });
});
