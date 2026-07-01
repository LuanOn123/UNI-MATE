import { Coffee, Compass, HeartHandshake, MessageCircle, Store, User } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const nav = [
  { to: "/app/discovery", label: "Khám phá", icon: HeartHandshake },
  { to: "/app/matches", label: "Match", icon: Coffee },
  { to: "/app/chat", label: "Chat", icon: MessageCircle },
  { to: "/app/places", label: "Quán", icon: Store },
  { to: "/app/profile", label: "Hồ sơ", icon: User }
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-cream text-cocoa">
      <aside className="fixed bottom-0 z-20 flex w-full justify-around border-t border-coffee/10 bg-white/95 px-2 py-2 backdrop-blur-xl md:inset-y-0 md:w-64 md:flex-col md:justify-start md:border-r md:border-t-0 md:p-5">
        <div className="mb-7 hidden items-center gap-3 md:flex">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-coffee text-white shadow-soft">
            <Coffee />
          </div>
          <div>
            <span className="block text-xl font-black text-cocoa">UNI-MATE</span>
            <span className="text-xs font-semibold text-coffee/55">Cafe-gated chat</span>
          </div>
        </div>
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition md:mb-2 md:min-w-0 md:flex-row md:gap-3 md:py-3 md:text-sm ${
                isActive ? "bg-latte text-cocoa shadow-sm" : "text-coffee/62 hover:bg-white hover:text-cocoa"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/app/safety"
          className={({ isActive }) =>
            `mt-auto hidden items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold md:flex ${
              isActive ? "bg-white text-cocoa shadow-sm" : "text-coffee/58 hover:bg-white"
            }`
          }
        >
          <Compass className="h-5 w-5" /> An toàn
        </NavLink>
      </aside>
      <main className="safe-bottom md:ml-64 md:min-h-screen md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
