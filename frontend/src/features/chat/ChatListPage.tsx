import { MessageCircle, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import type { ChatRoom, User } from "../../types";

function idOf(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id ?? value.id ?? "";
}

function otherUser(users: User[] = [], currentId: string) {
  return users.find((u) => idOf(u) !== currentId);
}

export function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const currentId = idOf(useAuthStore((s) => s.user));

  useEffect(() => {
    api.get("/chat").then((r) => setRooms(r.data.rooms)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><StateBlock title="Đang tải phòng chat" /></div>;
  if (!rooms.length) return <div className="p-6"><StateBlock title="Chưa có cuộc trò chuyện" text="Chat sẽ xuất hiện khi bạn match thành công với ai đó." /></div>;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Messages</p>
        <h1 className="text-3xl font-black">Chat</h1>
      </div>
      <div className="space-y-3">
        {rooms.map((room, i) => {
          const partner = otherUser(room.users, currentId);
          return (
            <motion.div key={room._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/app/chat/${room._id}`} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(111,78,55,0.18)]">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-latte text-cocoa">
                  {partner?.avatarUrl ? (
                    <img src={partner.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle className="h-7 w-7" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-black">{partner?.displayName || "UNI-MATE user"}</h3>
                  <p className="truncate text-sm text-coffee/70">{room.lastMessage ?? "Bắt đầu trò chuyện"}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

