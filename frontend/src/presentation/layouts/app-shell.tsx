import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../app/auth-context";

const links = [
  ["/dashboard", "Tổng quan", "01"],
  ["/readers", "Độc giả", "02"],
  ["/circulation", "Mượn / trả", "03"],
  ["/reservations", "Đặt chỗ", "04"],
] as const;

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>DGM</span><strong>Library</strong></div>
        <nav aria-label="Nghiệp vụ thư viện">
          {links.map(([to, label, number]) => <NavLink key={to} to={to}><small aria-hidden="true">{number}</small><span>{label}</span></NavLink>)}
        </nav>
        <div className="sidebar-footer"><span>{user ? `${user.username} · ${user.role}` : "Đang tải…"}</span><button onClick={() => void logout()}>Đăng xuất</button></div>
      </aside>
      <main className="workspace"><Outlet /></main>
    </div>
  );
}
