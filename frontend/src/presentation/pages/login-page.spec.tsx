import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { User } from "../../domain/auth";
import { createTestServices } from "../../test/fakes";
import { AuthProvider } from "../app/auth-context";
import { ServicesProvider } from "../app/services-context";
import { LoginPage } from "./login-page";

const staff: User = { id: "user-1", readerId: null, username: "staff", role: "STAFF" };

function renderLogin(services = createTestServices()) {
  render(
    <MemoryRouter initialEntries={["/login"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ServicesProvider services={services}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<h1>Tổng quan vận hành</h1>} />
          </Routes>
        </AuthProvider>
      </ServicesProvider>
    </MemoryRouter>,
  );
  return services;
}

describe("LoginPage", () => {
  it("validates empty credentials", async () => {
    const services = renderLogin();
    await userEvent.click(await screen.findByRole("button", { name: "Đăng nhập" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Tên đăng nhập và mật khẩu");
    expect(services.login.execute).not.toHaveBeenCalled();
  });

  it("navigates to the dashboard after successful login", async () => {
    const services = createTestServices();
    vi.mocked(services.login.execute).mockResolvedValue(staff);
    renderLogin(services);

    await userEvent.type(await screen.findByLabelText("Tên đăng nhập"), "staff");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "password1");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("Tổng quan vận hành")).toBeInTheDocument();
  });

  it("keeps the form and displays an authentication error", async () => {
    const services = createTestServices();
    vi.mocked(services.login.execute).mockRejectedValue(new Error("Sai tên đăng nhập hoặc mật khẩu"));
    renderLogin(services);

    await userEvent.type(await screen.findByLabelText("Tên đăng nhập"), "staff");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "password1");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sai tên đăng nhập hoặc mật khẩu");
    expect(screen.getByLabelText("Tên đăng nhập")).toHaveValue("staff");
  });
});
