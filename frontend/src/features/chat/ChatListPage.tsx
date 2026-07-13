import { AlertTriangle, Trash2, UserCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import type { ChatRoom, User } from "../../types";

function idOf(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id ?? value.id ?? "";
}

function otherUser(users: User[] = [], currentId: string) {
  return users.find((user) => idOf(user) !== currentId);
}

export function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [pendingRoom, setPendingRoom] = useState<ChatRoom | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const currentId = idOf(useAuthStore((state) => state.user));

  useEffect(() => {
    api.get("/chat").then((response) => setRooms(response.data.rooms)).finally(() => setLoading(false));
  }, []);

  const removeRoom = async () => {
    if (!pendingRoom) return;
    setDeletingId(pendingRoom._id);
    setDeleteError("");
    try {
      await api.delete(`/chat/${pendingRoom._id}`);
      setRooms((current) => current.filter((room) => room._id !== pendingRoom._id));
      setPendingRoom(null);
    } catch {
      setDeleteError("Không thể xóa cuộc trò chuyện. Vui lòng thử lại.");
    } finally {
      setDeletingId("");
    }
  };

  const pendingPartner = pendingRoom ? otherUser(pendingRoom.users, currentId) : undefined;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Messages</p>
        <h1 className="text-3xl font-black">Chat</h1>
      </div>

      {loading ? <StateBlock title="Đang tải phòng chat" /> : null}
      {!loading && !rooms.length ? (
        <StateBlock title="Chưa có cuộc trò chuyện" text="Chat sẽ xuất hiện khi bạn match thành công với ai đó." />
      ) : null}

      {!loading && rooms.length ? (
        <div className="space-y-3">
          {rooms.map((room, index) => {
            const partner = otherUser(room.users, currentId);
            return (
              <motion.div key={room._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <div className="flex items-center rounded-lg bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(111,78,55,0.18)]">
                  <Link to={`/app/chat/${room._id}`} className="flex min-w-0 flex-1 items-center gap-4 p-4">
                    <Avatar user={partner} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-black">{partner?.displayName || "Người dùng UNI-MATE"}</h3>
                      <p className="truncate text-sm text-coffee/70">{room.lastMessage ?? "Bắt đầu trò chuyện"}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="mr-4 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-coffee/55 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Xóa cuộc trò chuyện"
                    aria-label={`Xóa cuộc trò chuyện với ${partner?.displayName || "người dùng này"}`}
                    onClick={() => {
                      setDeleteError("");
                      setPendingRoom(room);
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : null}

      <AnimatePresence>
        {pendingRoom ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-cocoa/55 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !deletingId) setPendingRoom(null);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-chat-title"
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0_28px_80px_rgba(54,36,27,0.28)]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={pendingPartner} small />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-caramel">Xác nhận</p>
                    <h2 id="delete-chat-title" className="truncate text-xl font-black text-cocoa">Xóa cuộc trò chuyện?</h2>
                  </div>
                </div>
                <button
                  type="button"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-coffee/55 hover:bg-latte"
                  aria-label="Đóng"
                  disabled={Boolean(deletingId)}
                  onClick={() => setPendingRoom(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 flex gap-3 rounded-lg border border-caramel/20 bg-latte/65 p-4 text-sm text-coffee/75">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
                <p>
                  Cuộc trò chuyện với <strong className="text-cocoa">{pendingPartner?.displayName || "người dùng này"}</strong> chỉ bị xóa khỏi danh sách của bạn.
                </p>
              </div>

              {deleteError ? <p className="mt-3 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{deleteError}</p> : null}

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" disabled={Boolean(deletingId)} onClick={() => setPendingRoom(null)}>Giữ lại</Button>
                <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} disabled={Boolean(deletingId)} onClick={removeRoom}>
                  {deletingId ? "Đang xóa..." : "Xóa khỏi danh sách"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ user, small = false }: { user?: User; small?: boolean }) {
  const size = small ? "h-12 w-12" : "h-14 w-14";
  return (
    <div className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-full bg-latte text-cocoa`}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : <UserCircle className="h-7 w-7" />}
    </div>
  );
}
