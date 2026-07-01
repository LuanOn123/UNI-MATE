import { Coffee, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { api } from "../../lib/api";
import type { ChatRoom } from "../../types";

export function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/chat").then((r) => setRooms(r.data.rooms)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><StateBlock title="Đang tải phòng chat" /></div>;
  if (!rooms.length) return <div className="p-6"><StateBlock title="Chat đang khóa" text="Phòng chat sẽ xuất hiện sau khi match được xác nhận quán cafe." /></div>;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Messages</p>
        <h1 className="text-3xl font-black">Chat</h1>
      </div>
      <div className="space-y-3">
        {rooms.map((room, i) => (
          <motion.div key={room._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link to={`/app/chat/${room._id}`} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(111,78,55,0.18)]">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-latte text-cocoa">
                <MessageCircle />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-black">{room.place?.name || "Cafe chat"}</h3>
                <p className="truncate text-sm text-coffee/70">{room.lastMessage ?? "Bắt đầu trò chuyện"}</p>
              </div>
              <div className="hidden items-center gap-1 rounded-full bg-cream px-3 py-1 text-xs font-bold text-coffee md:flex">
                <Coffee className="h-3.5 w-3.5" /> Đã chốt quán
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
