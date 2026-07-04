import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { createTestServices } from "../../test/fakes";
import { AuthProvider } from "./auth-context";
import { ProtectedRoute } from "./protected-route";
import { ServicesProvider } from "./services-context";

const Location = () => <span data-testid="location">{useLocation().pathname}</span>;

describe("ProtectedRoute", () => {
  it("shows restoration state before redirecting anonymous users", async () => {
    let finish!: (value: null) => void;
    const services = createTestServices();
    vi.mocked(services.restoreSession.execute).mockReturnValue(new Promise((resolve) => { finish = resolve; }));

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ServicesProvider services={services}>
          <AuthProvider>
            <Location />
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<div>private</div>} />
              </Route>
              <Route path="/login" element={<div>login</div>} />
            </Routes>
          </AuthProvider>
        </ServicesProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Đang khôi phục phiên…")).toBeInTheDocument();
    finish(null);
    expect(await screen.findByText("login")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });
});
