import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { AppServices } from "../../application/services";
import { AppShell } from "../layouts/app-shell";
import { DashboardPage } from "../pages/dashboard-page";
import { CirculationPage } from "../pages/circulation-page";
import { LoginPage } from "../pages/login-page";
import { ReadersPage } from "../pages/readers-page";
import { ReservationsPage } from "../pages/reservations-page";
import { AuthProvider } from "./auth-context";
import { ProtectedRoute } from "./protected-route";
import { ServicesProvider } from "./services-context";

export function App({ services }: { services: AppServices }) {
  return (
    <ServicesProvider services={services}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/readers" element={<ReadersPage />} />
                <Route path="/circulation" element={<CirculationPage />} />
                <Route path="/reservations" element={<ReservationsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ServicesProvider>
  );
}
