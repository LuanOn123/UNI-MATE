import { Clock, Coffee, Lock, MessageCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CoffeeMeter } from "../../components/common/CoffeeMeter";
import { StateBlock } from "../../components/common/StateBlock";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import type { Match, User } from "../../types";

const statusCopy: Record<Match["status"], { label: string; tone: string; icon: any; helper: string }> = {
  matched: { label: "Cần chọn quán", tone: "bg-latte text-cocoa", icon: Coffee, helper: "Đề xuất một quán để người kia xác nhận." },
  cafe_proposed: { label: "Chờ xác nhận", tone: "bg-amber-100 text-amber-900", icon: Clock, helper: "Chat vẫn khóa cho tới khi quán được đồng ý." },
  cafe_confirmed: { label: "Quán đã xác nhận", tone: "bg-mint text-cocoa", icon: Coffee, helper: "Sẵn sàng mở chat." },
  chat_opened: { label: "Chat đã mở", tone: "bg-mint text-cocoa", icon: MessageCircle, helper: "Vào chat để chốt thời gian gặp." },
  expired: { label: "Hết hạn", tone: "bg-slate-100 text-slate-600", icon: Lock, helper: "Match hết hạn sau 72 giờ nếu chưa chốt quán." },
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "need_cafe" | "chat">("all");
  const currentId = getId(useAuthStore((s) => s.user));

  useEffect(() => {
    api.get("/matches").then((r) => setMatches(r.data.matches)).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    if (filter === "need_cafe") return matches.filter((m) => ["matched", "cafe_proposed"].includes(m.status));
    if (filter === "chat") return matches.filter((m) => m.status === "chat_opened");
    return matches;
  }, [filter, matches]);

  if (loading) return <div className="p-6"><StateBlock title="Đang tải match" /></div>;
  if (!matches.length) return <div className="p-6"><StateBlock title="Chưa có match" text="Like người hợp gu ở Discovery để bắt đầu cafe-gated chat." /></div>;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Cafe gate</p>
          <h1 className="text-3xl font-black">Matches</h1>
        </div>
        <div className="flex rounded-lg bg-white p-1 shadow-sm">
          {[
            ["all", "Tất cả"],
            ["need_cafe", "Cần chốt quán"],
            ["chat", "Đã mở chat"]
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key as any)} className={`rounded-md px-3 py-2 text-sm font-bold transition ${filter === key ? "bg-latte text-cocoa" : "text-coffee/58 hover:text-cocoa"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((match, i) => {
          const room = typeof match.chatRoom !== "string" ? match.chatRoom : undefined;
          const opened = match.status === "chat_opened" && room?._id;
          const person = otherUser(match, currentId);
          const copy = statusCopy[match.status];
          const Icon = copy.icon;
          const selectedByMe = String(match.selectedBy ?? "") === currentId;
          return (
            <motion.div key={match._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }} className="overflow-hidden rounded-lg bg-white shadow-soft">
              <div className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${person?.avatarUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=500&auto=format&fit=crop"})` }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="truncate text-lg font-black">{person?.displayName || "UNI-MATE user"}</h3>
                      <p className="truncate text-sm text-coffee/62">{person?.school || "Sinh viên"} {person?.major ? `· ${person.major}` : ""}</p>
                    </div>
                    <CoffeeMeter value={match.score ?? 0} size="sm" />
                  </div>
                  <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${copy.tone}`}>
                    <Icon className="h-4 w-4" /> {copy.label}
                  </div>
                </div>
              </div>
              <div className="border-t border-coffee/10 p-4">
                {match.selectedPlace ? (
                  <div className="mb-3 rounded-lg bg-cream p-3 text-sm">
                    <p className="font-black">{match.selectedPlace.name}</p>
                    <p className="mt-1 text-coffee/62">{match.selectedPlace.address}</p>
                    <p className="mt-2 text-xs font-bold text-caramel">{selectedByMe ? "Bạn đã đề xuất, đang chờ người kia." : "Người kia đã đề xuất, hãy xác nhận nếu phù hợp."}</p>
                  </div>
                ) : null}
                <p className="min-h-10 text-sm font-medium text-coffee/70">{match.reasons?.[0] ?? copy.helper}</p>
                <Link to={opened ? `/app/chat/${room._id}` : `/app/matches/${match._id}/places`} className="mt-4 block">
                  <Button className="w-full" icon={opened ? <MessageCircle /> : <Coffee />}>
                    {opened ? "Vào chat" : match.status === "cafe_proposed" && !selectedByMe ? "Xác nhận quán" : "Chọn quán"}
                  </Button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      {!visible.length ? <div className="mt-8"><StateBlock title="Không có match trong bộ lọc này" /></div> : null}
    </div>
  );
}
