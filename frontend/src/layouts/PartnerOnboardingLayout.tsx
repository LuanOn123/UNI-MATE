import { Bell, ClipboardCheck, HelpCircle, LogOut, Store } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const nav = [
  { to: "/app/partner-register", label: "Hồ sơ quán", icon: ClipboardCheck },
  { to: "/app/partner-register?tab=notifications", label: "Thông báo", icon: Bell },
  { to: "/app/partner-register?tab=support", label: "Hỗ trợ", icon: HelpCircle }
];

export function PartnerOnboardingLayout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream text-cocoa">
      <aside className="fixed bottom-0 z-20 flex w-full justify-around border-t border-coffee/10 bg-white/95 px-2 py-2 backdrop-blur-xl md:inset-y-0 md:w-64 md:flex-col md:justify-start md:border-r md:border-t-0 md:p-5">
        <div className="mb-8 hidden items-center gap-3 md:flex">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-caramel text-white shadow-soft">
            <Store />
          </div>
          <div>
            <span className="block text-xl font-black text-cocoa">UNI-MATE</span>
            <span className="text-xs font-semibold text-coffee/55">Khu vực đối tác</span>
          </div>
        </div>

        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition md:mb-2 md:min-w-0 md:flex-row md:gap-3 md:py-3 md:text-sm ${
                isActive ? "bg-caramel text-white shadow-sm" : "text-coffee/62 hover:bg-white hover:text-cocoa"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto hidden items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 md:flex"
        >
          <LogOut className="h-5 w-5" /> Đăng xuất
        </button>
      </aside>

      <main className="safe-bottom md:ml-64 md:min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
