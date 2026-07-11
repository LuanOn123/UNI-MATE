import { BarChart3, Coffee, Flag, History, LogOut, Settings, Tags, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const nav = [
  ["/admin/dashboard", "Tổng quan", BarChart3],
  ["/admin/users", "Người dùng", Users],
  ["/admin/reports", "Báo cáo", Flag],
  ["/admin/matches", "Ghép đôi", Coffee],
  ["/admin/places", "Địa điểm", Coffee],
  ["/admin/tags", "Thẻ", Tags],
  ["/admin/actions", "Nhật ký", History],
  ["/admin/settings", "Cài đặt", Settings]
] as const;

export function AdminLayout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <aside className="fixed inset-y-0 hidden w-64 border-r bg-white p-5 md:block">
        <h1 className="mb-8 text-xl font-black">UNI-MATE Admin</h1>
        {nav.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `mb-2 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            <Icon className="h-5 w-5" />{label}
          </NavLink>
        ))}
        <button type="button" onClick={handleLogout} className="mt-8 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50">
          <LogOut className="h-5 w-5" /> Đăng xuất
        </button>
      </aside>
      <header className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-black">UNI-MATE Admin</h1>
          <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
        <nav className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="md:ml-64"><Outlet /></main>
    </div>
  );
}
