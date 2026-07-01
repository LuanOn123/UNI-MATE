import { Ban, Coffee, ExternalLink, Flag, MapPin, Send, UserCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuthStore } from "../../stores/authStore";
import type { ChatRoom, Message, User } from "../../types";

type UiMessage = Message & { pending?: boolean; senderId?: string; mine?: boolean };

function idOf(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id ?? value.id ?? "";
}

function isMine(message: UiMessage, currentId: string) {
  if (typeof message.mine === "boolean") return message.mine;
  if (message.senderId) return String(message.senderId) === currentId;
  return idOf(message.sender) === currentId;
}

function otherUser(users: User[] = [], currentId: string) {
  return users.find((user) => idOf(user) !== currentId);
}

function statusFor(message: UiMessage, partnerId: string) {
  if (message.pending) return "Đã gửi";
  if ((message.readBy ?? []).map(String).includes(partnerId)) return "Đã xem";
  return "Đã nhận";
}

export function ChatRoomPage() {
  const { roomId } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const [apiCurrentId, setApiCurrentId] = useState("");
  const currentId = apiCurrentId || idOf(currentUser);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const partner = useMemo(() => otherUser(room?.users, currentId), [room?.users, currentId]);
  const partnerId = idOf(partner);
  const blocked = room?.status === "blocked";

  useEffect(() => {
    let mounted = true;
    api.get(`/chat/${roomId}`).then((r) => {
      if (!mounted) return;
      const serverCurrentId = r.data.currentUserId ?? "";
      setApiCurrentId(serverCurrentId);
      setRoom(r.data.room);
      setMessages((r.data.messages ?? []).map((message: UiMessage) => ({
        ...message,
        mine: typeof message.mine === "boolean" ? message.mine : isMine(message, serverCurrentId || idOf(currentUser))
      })));
      getSocket().emit("mark_read", { roomId });
    }).catch((e) => setNotice(e.response?.data?.message ?? "Không tải được phòng chat."));

    const socket = getSocket();
    socket.emit("join_room", { roomId });
    socket.on("new_message", (message: UiMessage) => {
      setMessages((list) => {
        const effectiveCurrentId = apiCurrentId || idOf(currentUser);
        const mine = message.senderId ? String(message.senderId) === effectiveCurrentId : isMine(message, effectiveCurrentId);
        const normalized = { ...message, mine };
        return [...list.filter((m) => !(m.pending && m.text === message.text && isMine(m, effectiveCurrentId) === mine)), normalized];
      });
      const effectiveCurrentId = apiCurrentId || idOf(currentUser);
      const mine = message.senderId ? String(message.senderId) === effectiveCurrentId : isMine(message, effectiveCurrentId);
      if (!mine) socket.emit("mark_read", { roomId });
    });
    socket.on("message_read", (event) => {
      setMessages((list) => list.map((message) => {
        const readBy = new Set((message.readBy ?? []).map(String));
        readBy.add(event.userId);
        return { ...message, readBy: [...readBy] };
      }));
    });
    socket.on("user_typing", (event) => setTyping(event.typing));
    return () => {
      mounted = false;
      socket.off("new_message");
      socket.off("message_read");
      socket.off("user_typing");
    };
  }, [roomId, apiCurrentId, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  const lastMineId = useMemo(() => {
    const mine = [...messages].reverse().find((message) => isMine(message, currentId));
    return mine?._id;
  }, [messages, currentId]);

  const send = async () => {
    if (!text.trim() || blocked) return;
    const content = text.trim();
    const temp: UiMessage = {
      _id: `temp-${Date.now()}`,
      room: roomId ?? "",
      sender: currentId,
      senderId: currentId,
      mine: true,
      text: content,
      readBy: [],
      createdAt: new Date().toISOString(),
      pending: true
    };
    setText("");
    setMessages((list) => [...list, temp]);
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("send_message", { roomId, text: content });
      return;
    }
    try {
      const { data } = await api.post(`/chat/${roomId}/messages`, { text: content });
      setMessages((list) => [...list.filter((m) => m._id !== temp._id), data.message]);
    } catch (e: any) {
      setMessages((list) => list.filter((m) => m._id !== temp._id));
      setNotice(e.response?.data?.message ?? "Không gửi được tin nhắn.");
    }
  };

  const report = async () => {
    if (!partnerId || !reason.trim()) return;
    await api.post("/safety/report", { reportedUser: partnerId, match: typeof room?.match === "string" ? room.match : room?.match?._id, reason });
    setNotice("Đã gửi report cho admin.");
    setReportOpen(false);
    setReason("");
  };

  const block = async () => {
    if (!partnerId) return;
    await api.post("/safety/block", { targetUserId: partnerId });
    setRoom((value) => value ? { ...value, status: "blocked" } : value);
    setNotice("Đã block người dùng. Chat đã khóa.");
  };

  return (
    <div className="flex h-screen flex-col bg-[#f8efe5]">
      <header className="border-b border-coffee/10 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to="/app/chat" className="text-sm font-bold text-caramel">← Chat</Link>
            <div className="mt-1 flex items-center gap-3">
              <Avatar user={partner} />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black">{partner?.displayName || "Cafe chat"}</h1>
                <p className="text-xs font-semibold text-coffee/55">Đang trong cafe-gated chat</p>
              </div>
            </div>
            {room?.place ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-cream px-3 py-2 text-sm font-semibold text-coffee">
                <Coffee className="h-4 w-4 text-caramel" />
                <span>{room.place.name}</span>
                <span className="hidden text-coffee/45 md:inline">·</span>
                <span className="inline-flex min-w-0 items-center gap-1 text-coffee/70"><MapPin className="h-4 w-4" />{room.place.address}</span>
                {room.place.mapsUrl ? <a href={room.place.mapsUrl} target="_blank" rel="noreferrer" className="text-caramel"><ExternalLink className="h-4 w-4" /></a> : null}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" icon={<Flag />} onClick={() => setReportOpen(true)} />
            <Button variant="danger" icon={<Ban />} onClick={block} />
          </div>
        </div>
      </header>

      {notice ? <p className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-5xl rounded-lg bg-mint p-3 text-sm font-bold text-cocoa">{notice}</p> : null}
      {blocked ? <p className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-5xl rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">Chat đã khóa vì một bên đã block.</p> : null}

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-1 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const mine = isMine(message, currentId);
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const previousMine = previous ? isMine(previous, currentId) : false;
            const nextMine = next ? isMine(next, currentId) : false;
            const groupedWithPrevious = previous && previousMine === mine;
            const groupedWithNext = next && nextMine === mine;
            const showAvatar = !mine && !groupedWithNext;
            const showStatus = mine && message._id === lastMineId;
            return (
              <motion.div key={message._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${groupedWithPrevious ? "mt-1" : "mt-3"}`}>
                {!mine ? <div className="w-8 shrink-0">{showAvatar ? <Avatar user={partner} size="sm" /> : null}</div> : null}
                <div className={`max-w-[72%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`rounded-[1.35rem] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${mine ? "bg-coffee text-white" : "bg-white text-cocoa"} ${mine && groupedWithNext ? "rounded-br-md" : ""} ${mine && groupedWithPrevious ? "rounded-tr-md" : ""} ${!mine && groupedWithNext ? "rounded-bl-md" : ""} ${!mine && groupedWithPrevious ? "rounded-tl-md" : ""}`}>
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  </div>
                  {showStatus ? <span className="mt-1 pr-1 text-[11px] font-semibold text-coffee/55">{statusFor(message, partnerId)}</span> : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {typing ? <p className="ml-10 mt-2 text-sm font-semibold text-coffee/60">Đang nhập...</p> : null}
        <div ref={scrollRef} />
      </main>

      <footer className="border-t border-coffee/10 bg-white p-3">
        <div className="mx-auto flex max-w-5xl gap-2">
          <Input
            value={text}
            disabled={blocked}
            placeholder={blocked ? "Chat đã khóa" : "Nhắn tin để chốt thời gian cafe"}
            onChange={(e) => {
              setText(e.target.value);
              getSocket().emit("typing_start", { roomId });
            }}
            onBlur={() => getSocket().emit("typing_stop", { roomId })}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="rounded-full"
          />
          <Button icon={<Send />} onClick={send} disabled={!text.trim() || blocked} className="rounded-full px-5">Gửi</Button>
        </div>
      </footer>

      {reportOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-cocoa/55 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
            <h2 className="text-xl font-black">Report người dùng</h2>
            <p className="mt-2 text-sm text-coffee/70">Admin sẽ chỉ xử lý thông tin bạn gửi trong report.</p>
            <Input className="mt-4" placeholder="Lý do report" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(false)}>Hủy</Button>
              <Button variant="danger" onClick={report} disabled={!reason.trim()}>Gửi report</Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ user, size = "md" }: { user?: User; size?: "sm" | "md" }) {
  const [broken, setBroken] = useState(false);
  const cls = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  return (
    <div className={`${cls} grid shrink-0 place-items-center overflow-hidden rounded-full bg-latte text-cocoa`}>
      {user?.avatarUrl && !broken ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} /> : <UserCircle className="h-5 w-5" />}
    </div>
  );
}
