import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { AppServices } from "../../application/services";
import { AppShell } from "../layouts/app-shell";
import { DashboardPage } from "../pages/dashboard-page";
import { LoginPage } from "../pages/login-page";
import { AuthProvider } from "./auth-context";
import { ProtectedRoute } from "./protected-route";
import { ServicesProvider } from "./services-context";

export function App({ services }: { services: AppServices }) {
  return (
    <ServicesProvider services={services}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ServicesProvider>
  );
}
