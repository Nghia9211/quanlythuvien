import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./auth-context";

export function ProtectedRoute() {
  const { status } = useAuth();
  if (status === "restoring") return <p role="status">Đang khôi phục phiên…</p>;
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return <Outlet />;
}
