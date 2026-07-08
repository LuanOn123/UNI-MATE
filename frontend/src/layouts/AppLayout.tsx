import { Bell, Coffee, Compass, Eye, Heart, HeartHandshake, MessageCircle, Store, User, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CoffeeMeter } from "../components/common/CoffeeMeter";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { NotificationItem, User as UserType } from "../types";
import { useAuthStore } from "../stores/authStore";

const nav = [
  { to: "/app/discovery", label: "Khám phá", icon: HeartHandshake },
  { to: "/app/matches", label: "Match", icon: Coffee },
  { to: "/app/chat", label: "Chat", icon: MessageCircle },
  { to: "/app/groups", label: "Nhóm", icon: Users },
  { to: "/app/places", label: "Quán", icon: Store },
  { to: "/app/profile", label: "Hồ sơ", icon: User }
];

const fallbackPhoto = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=900&auto=format&fit=crop";

function idOf(user?: Partial<UserType> | null) {
  return user?._id ?? user?.id ?? "";
}

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const [likePopup, setLikePopup] = useState<NotificationItem | null>(null);
  const [detailUser, setDetailUser] = useState<Partial<UserType> | null>(null);
  const [ringing, setRinging] = useState(false);
  const navigate = useNavigate();
  const unread = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);

  useEffect(() => {
    api.get("/notifications").then((res) => setNotifications(res.data.notifications ?? [])).catch(() => undefined);
    const socket = getSocket();
    const onNotification = (notification: NotificationItem) => {
      setNotifications((items) => [notification, ...items.filter((item) => item._id !== notification._id)].slice(0, 50));
      setRinging(true);
      window.setTimeout(() => setRinging(false), 1900);
      if (notification.type === "incoming_like" && notification.data?.actorId) {
        setLikePopup(notification);
      } else {
        setToast(notification);
        window.setTimeout(() => setToast((current) => (current?._id === notification._id ? null : current)), 4200);
      }
    };
    socket.on("notification:new", onNotification);
    return () => {
      socket.off("notification:new", onNotification);
    };
  }, []);

  const markAllRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    await api.patch("/notifications/read-all").catch(() => undefined);
  };

  const respondLike = async (notification: NotificationItem, action: "like" | "pass") => {
    const targetUserId = notification.data?.actorId;
    if (!targetUserId) return;
    const { data } = await api.post(`/discovery/${action}`, { targetUserId });
    setLikePopup(null);
    setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item));
    await api.patch(`/notifications/${notification._id}/read`).catch(() => undefined);
    if (data.matched) navigate(`/app/matches/${data.match._id}/places`);
  };

  const openNotification = (notification: NotificationItem) => {
    if (notification.type === "incoming_like" && notification.data?.actor) {
      setLikePopup(notification);
      return;
    }
    if (notification.type === "message") navigate("/app/chat");
    if (notification.type.includes("cafe") || notification.type.includes("match")) navigate("/app/matches");
    setDrawerOpen(false);
  };

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
        <button
          type="button"
          onClick={() => setDrawerOpen((value) => !value)}
          className="mb-4 hidden items-center justify-between rounded-lg border border-coffee/10 bg-white px-3 py-3 text-left text-sm font-bold text-coffee shadow-sm transition hover:bg-latte md:flex"
        >
          <span className="flex items-center gap-3">
            <Bell className={`h-5 w-5 ${ringing ? "bell-ring text-caramel" : ""}`} />
            Thông báo
          </span>
          {unread ? <span className="grid min-w-6 place-items-center rounded-full bg-caramel px-2 py-0.5 text-xs text-white">{unread}</span> : null}
        </button>
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
            {to === "/app/chat" && unread ? <span className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full bg-caramel md:hidden" /> : null}
          </NavLink>
        ))}
        {user?.role === "partner" && (
          <NavLink
            to="/app/partner/dashboard"
            className={({ isActive }) =>
              `relative flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition md:mb-2 md:min-w-0 md:flex-row md:gap-3 md:py-3 md:text-sm ${
                isActive ? "bg-caramel text-white shadow-sm" : "text-caramel hover:bg-latte"
              }`
            }
          >
            <Store className="h-5 w-5" />
            <span>Quán của tôi</span>
          </NavLink>
        )}
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

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed right-4 top-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-white text-coffee shadow-soft md:hidden"
      >
        <Bell className={`h-5 w-5 ${ringing ? "bell-ring text-caramel" : ""}`} />
        {unread ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-caramel px-1 text-xs font-black text-white">{unread}</span> : null}
      </button>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 bg-cocoa/35 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
          <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-soft" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-coffee/10 p-4">
              <div>
                <h2 className="text-xl font-black">Thông báo</h2>
                <p className="text-sm font-semibold text-coffee/55">{unread ? `${unread} thông báo chưa đọc` : "Bạn đã đọc hết thông báo"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={markAllRead}>Đánh dấu đọc</Button>
                <button type="button" className="rounded-lg p-2 text-coffee/60 hover:bg-cream" onClick={() => setDrawerOpen(false)}><X /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {!notifications.length ? <p className="rounded-lg bg-cream p-4 text-sm font-semibold text-coffee/65">Chưa có thông báo nào.</p> : null}
              {notifications.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => openNotification(item)}
                  className={`mb-2 w-full rounded-lg border p-3 text-left transition hover:bg-cream ${item.readAt ? "border-coffee/8 bg-white" : "border-caramel/25 bg-latte/65"}`}
                >
                  <div className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-caramel">
                      {item.type === "incoming_like" ? <Heart className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black">{item.title}</p>
                      {item.body ? <p className="mt-1 line-clamp-2 text-sm font-semibold text-coffee/65">{item.body}</p> : null}
                      <p className="mt-2 text-xs font-bold text-coffee/40">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {toast ? <NotificationToast notification={toast} onClose={() => setToast(null)} /> : null}

      {likePopup ? (
        <IncomingLikePopup
          notification={likePopup}
          onClose={() => setLikePopup(null)}
          onView={(user) => setDetailUser(user)}
          onRespond={(action) => respondLike(likePopup, action)}
        />
      ) : null}

      {detailUser ? <ProfilePreview user={detailUser} onClose={() => setDetailUser(null)} /> : null}
    </div>
  );
}

function NotificationToast({ notification, onClose }: { notification: NotificationItem; onClose: () => void }) {
  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-coffee/10 bg-white p-4 shadow-[0_18px_50px_rgba(69,44,30,0.18)]">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-latte text-caramel">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-black">{notification.title}</p>
          {notification.body ? <p className="mt-1 text-sm font-semibold text-coffee/68">{notification.body}</p> : null}
        </div>
        <button type="button" className="rounded-md p-1 text-coffee/50 hover:bg-cream hover:text-cocoa" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function IncomingLikePopup({ notification, onClose, onView, onRespond }: { notification: NotificationItem; onClose: () => void; onView: (user: Partial<UserType>) => void; onRespond: (action: "like" | "pass") => void }) {
  const actor = notification.data?.actor;
  const photos = [actor?.avatarUrl, ...(actor?.profilePhotos ?? [])].filter(Boolean) as string[];
  const photo = photos[0] ?? fallbackPhoto;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-cocoa/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[1.4rem] bg-white shadow-soft">
        <div className="relative h-72 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa/88 via-cocoa/10 to-transparent" />
          <button type="button" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/86 text-cocoa" onClick={onClose}><X className="h-5 w-5" /></button>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-caramel">New like</p>
            <h2 className="mt-1 text-3xl font-black">{actor?.displayName ?? "Một người dùng"}, {actor?.age ?? "18+"}</h2>
            <p className="mt-1 font-semibold text-white/78">{actor?.school ?? "Sinh viên"} {actor?.major ? `· ${actor.major}` : ""}</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold text-coffee/70">{notification.body}</p>
          <div className="mt-4 rounded-lg bg-cream p-3">
            <CoffeeMeter value={actor?.matchMeta?.score ?? 70} size="sm" label="độ hợp gu" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Button variant="ghost" onClick={() => onRespond("pass")} icon={<X />}>Nope</Button>
            <Button variant="ghost" onClick={() => actor && onView(actor)} icon={<Eye />}>Chi tiết</Button>
            <Button onClick={() => onRespond("like")} icon={<Heart />}>Like</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePreview({ user, onClose }: { user: Partial<UserType>; onClose: () => void }) {
  const photos = [user.avatarUrl, ...(user.profilePhotos ?? [])].filter(Boolean) as string[];
  const photo = photos[0] ?? fallbackPhoto;
  const styles = (user.onboarding?.cafeStyles ?? []) as string[];
  const goals = (user.onboarding?.goals ?? []) as string[];
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-cocoa/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.4rem] bg-white shadow-soft">
        <div className="relative h-96 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa/88 via-transparent to-transparent" />
          <button type="button" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/86 text-cocoa" onClick={onClose}><X className="h-5 w-5" /></button>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h2 className="text-4xl font-black">{user.displayName ?? "UNI-MATE user"}, {user.age ?? "18+"}</h2>
            <p className="mt-1 font-semibold text-white/78">{user.school ?? "Sinh viên"} {user.major ? `· ${user.major}` : ""}</p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid gap-3 text-sm font-semibold text-coffee/75 md:grid-cols-3">
            <p className="rounded-lg bg-cream p-3"><b>Cung:</b> {user.zodiac ?? "Đang cập nhật"}</p>
            <p className="rounded-lg bg-cream p-3"><b>Giới tính:</b> {user.gender ?? "Chưa tiết lộ"}</p>
            <p className="rounded-lg bg-cream p-3"><b>Khu vực:</b> {user.location?.addressLabel ?? "Đang cập nhật"}</p>
          </div>
          <div>
            <h3 className="mb-2 font-black">Gu cafe</h3>
            <div className="flex flex-wrap gap-2">{styles.map((item) => <span key={item} className="rounded-full bg-latte px-3 py-1 text-sm font-bold">{item}</span>)}</div>
          </div>
          <div>
            <h3 className="mb-2 font-black">Mục tiêu gặp</h3>
            <div className="flex flex-wrap gap-2">{goals.map((item) => <span key={item} className="rounded-full bg-cream px-3 py-1 text-sm font-bold text-coffee">{item}</span>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
