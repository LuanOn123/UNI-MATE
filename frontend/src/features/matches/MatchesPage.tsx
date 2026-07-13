import { Heart, Lock, MessageCircle, ShieldAlert, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import type { Match, User } from "../../types";

const fallbackPhoto = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=500&auto=format&fit=crop";

const statusCopy: Record<Match["status"], { label: string; tone: string; icon: any; helper: string }> = {
  matched: { label: "Đã match", tone: "bg-mint text-cocoa", icon: MessageCircle, helper: "Phòng chat sẽ mở ngay khi hệ thống tạo xong." },
  cafe_proposed: { label: "Đã match", tone: "bg-mint text-cocoa", icon: MessageCircle, helper: "Luồng mới không cần chọn quán trước khi chat." },
  cafe_confirmed: { label: "Đã match", tone: "bg-mint text-cocoa", icon: MessageCircle, helper: "Luồng mới không cần chọn quán trước khi chat." },
  chat_opened: { label: "Chat đã mở", tone: "bg-mint text-cocoa", icon: MessageCircle, helper: "Vào chat để trò chuyện." },
  expired: { label: "Hết hạn", tone: "bg-slate-100 text-slate-600", icon: Lock, helper: "Match đã hết hạn." },
  blocked: { label: "Đã khóa", tone: "bg-rose-100 text-rose-700", icon: ShieldAlert, helper: "Kết nối này đã bị khóa vì lý do an toàn." },
  cancelled: { label: "Đã hủy", tone: "bg-slate-100 text-slate-600", icon: Lock, helper: "Match đã được hủy." }
};

function getId(user?: User | null) {
  return user?._id ?? user?.id;
}

function otherUser(match: Match, currentId?: string) {
  return match.users?.find((u) => getId(u) !== currentId) ?? match.users?.[0];
}

export function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "chat">("all");
  const [message, setMessage] = useState("");
  const currentId = getId(useAuthStore((s) => s.user));
  const navigate = useNavigate();

  const load = async () => {
    const [matchRes, likesRes] = await Promise.all([
      api.get("/matches"),
      api.get("/discovery/incoming-likes").catch(() => ({ data: { users: [] } }))
    ]);
    setMatches(matchRes.data.matches);
    setIncomingLikes(likesRes.data.users);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const visible = useMemo(() => {
    if (filter === "chat") return matches.filter((m) => m.status === "chat_opened");
    return matches;
  }, [filter, matches]);

  const respondLike = async (user: User, action: "like" | "pass") => {
    const targetUserId = getId(user);
    if (!targetUserId) return;
    try {
      const { data } = await api.post(`/discovery/${action}`, { targetUserId });
      setIncomingLikes((list) => list.filter((item) => getId(item) !== targetUserId));
      if (data.matched) {
        setMessage("Đã match! Chat đã mở.");
        await load();
        const chatRoomId = typeof data.match?.chatRoom === "string" ? data.match.chatRoom : data.match?.chatRoom?._id;
        if (chatRoomId) navigate(`/app/chat/${chatRoomId}`);
        else navigate(`/app/chat`);
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message ?? "Không xử lý được lượt like.");
    }
  };

  const cancelMatch = async (match: Match) => {
    if (!window.confirm("Bạn có chắc muốn hủy match này?")) return;
    try {
      await api.post(`/matches/${match._id}/cancel`);
      setMessage("Đã hủy match.");
      await load();
    } catch (e: any) {
      setMessage(e.response?.data?.message ?? "Không hủy được match.");
    }
  };
  if (loading) return <div className="p-6"><StateBlock title="Đang tải match" /></div>;
  if (!matches.length && !incomingLikes.length) return <div className="p-6"><StateBlock title="Chưa có match" text="Bật GPS thật và like người hợp gu ở Discovery để bắt đầu chat." /></div>;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Match chat</p>
          <h1 className="text-3xl font-black">Matches</h1>
          <p className="mt-2 text-sm font-semibold text-coffee/60">Trang này tự cập nhật mỗi 5 giây để thấy lượt like/match mới.</p>
        </div>
        <div className="flex rounded-lg bg-white p-1 shadow-sm">
          {[
            ["all", "Tất cả"],
            ["chat", "Đang chat"]
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key as any)} className={`rounded-md px-3 py-2 text-sm font-bold transition ${filter === key ? "bg-latte text-cocoa" : "text-coffee/58 hover:text-cocoa"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {message ? <p className="mb-4 rounded-lg bg-mint p-3 text-sm font-bold text-cocoa">{message}</p> : null}

      {incomingLikes.length ? (
        <section className="mb-6 rounded-lg bg-white p-5 shadow-soft">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-black"><Heart className="h-5 w-5 text-caramel" /> Người muốn match với bạn</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {incomingLikes.map((user) => (
              <div key={getId(user)} className="rounded-lg border border-coffee/10 p-4">
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${user.avatarUrl || fallbackPhoto})` }} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-black">{user.displayName || "Người dùng UNI-MATE"}, {user.age ?? "18+"}</h3>
                    <p className="truncate text-sm text-coffee/60">{user.school || "Sinh viên"} {user.major ? `· ${user.major}` : ""}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="ghost" icon={<X />} onClick={() => respondLike(user, "pass")}>Bỏ qua</Button>
                  <Button icon={<Heart />} onClick={() => respondLike(user, "like")}>Thích lại</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((match, i) => {
          const room = typeof match.chatRoom !== "string" ? match.chatRoom : undefined;
          const opened = match.status === "chat_opened" && room?._id;
          const person = otherUser(match, currentId);
          const copy = statusCopy[match.status];
          const Icon = copy.icon;
          return (
            <motion.div key={match._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }} className="overflow-hidden rounded-lg bg-white shadow-soft">
              <div className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${person?.avatarUrl || fallbackPhoto})` }} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black">{person?.displayName || "Người dùng UNI-MATE"}</h3>
                  <p className="truncate text-sm text-coffee/62">{person?.school || "Sinh viên"} {person?.major ? `· ${person.major}` : ""}</p>
                  <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${copy.tone}`}>
                    <Icon className="h-4 w-4" /> {copy.label}
                  </div>
                </div>
              </div>
              <div className="border-t border-coffee/10 p-4">
                <p className="min-h-10 text-sm font-medium text-coffee/70">{match.reasons?.[0] ?? copy.helper}</p>
                <Link to={opened ? `/app/chat/${room._id}` : "/app/chat"} className="mt-4 block">
                  <Button className="w-full" icon={<MessageCircle />}>
                    {opened ? "Vào chat" : "Mở danh sách chat"}
                  </Button>
                </Link>
                {!['cancelled', 'blocked', 'expired'].includes(match.status) ? (
                  <Button className="mt-2 w-full" variant="ghost" icon={<X />} onClick={() => cancelMatch(match)}>
                    Huy match
                  </Button>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
      {!visible.length && matches.length ? <div className="mt-8"><StateBlock title="Không có match trong bộ lọc này" /></div> : null}
    </div>
  );
}
