import { Ban, Coffee, ExternalLink, Flag, ImagePlus, MapPin, Send, Smile, UserCircle, Paperclip, FileText, Unlock, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
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
type BlockState = { blockedByMe: boolean; blockedByOther: boolean };

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
  const [incidentAt, setIncidentAt] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [notice, setNotice] = useState("");
  const [composerNote, setComposerNote] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blockState, setBlockState] = useState<BlockState>({ blockedByMe: false, blockedByOther: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmoji]);

  const partner = useMemo(() => otherUser(room?.users, currentId), [room?.users, currentId]);
  const partnerId = idOf(partner);
  const blockedByMe = blockState.blockedByMe;
  const blockedByOther = blockState.blockedByOther;
  const generallyBlocked = room?.status === "blocked" && !blockedByMe && !blockedByOther;
  const inputDisabled = blockedByMe || blockedByOther || generallyBlocked;

  useEffect(() => {
    let mounted = true;
    api.get(`/chat/${roomId}`).then((r) => {
      if (!mounted) return;
      const serverCurrentId = r.data.currentUserId ?? "";
      setApiCurrentId(serverCurrentId);
      setRoom(r.data.room);
      setBlockState(r.data.blockState ?? { blockedByMe: false, blockedByOther: false });
      setMessages((r.data.messages ?? []).map((message: UiMessage) => ({
        ...message,
        mine: typeof message.mine === "boolean" ? message.mine : isMine(message, serverCurrentId || idOf(currentUser))
      })));
      getSocket().emit("mark_read", { roomId });
    }).catch((e) => setNotice(e.response?.data?.message ?? "Không tải được phòng chat."));

    const socket = getSocket();
    socket.emit("join_room", { roomId });
    const onNewMessage = (message: UiMessage) => {
      setMessages((list) => {
        const effectiveCurrentId = apiCurrentId || idOf(currentUser);
        const mine = message.senderId ? String(message.senderId) === effectiveCurrentId : isMine(message, effectiveCurrentId);
        const normalized = { ...message, mine };
        return [...list.filter((m) => !(m.pending && m.text === message.text && isMine(m, effectiveCurrentId) === mine)), normalized];
      });
      const effectiveCurrentId = apiCurrentId || idOf(currentUser);
      const mine = message.senderId ? String(message.senderId) === effectiveCurrentId : isMine(message, effectiveCurrentId);
      if (!mine) socket.emit("mark_read", { roomId });
    };
    const onRead = (event: { userId: string }) => {
      setMessages((list) => list.map((message) => {
        const readBy = new Set((message.readBy ?? []).map(String));
        readBy.add(event.userId);
        return { ...message, readBy: [...readBy] };
      }));
    };
    const onTyping = (event: { typing: boolean; userId: string }) => {
      console.log("Received user_typing event", event);
      setTyping(event.typing);
    };
    const onMessageError = (event: { roomId?: string; message?: string }) => {
      if (!event.roomId || event.roomId === roomId) setComposerNote(event.message ?? "Không gửi được tin nhắn.");
    };
    socket.on("new_message", onNewMessage);
    socket.on("message_read", onRead);
    socket.on("user_typing", onTyping);
    socket.on("message_error", onMessageError);
    return () => {
      mounted = false;
      socket.off("new_message", onNewMessage);
      socket.off("message_read", onRead);
      socket.off("user_typing", onTyping);
      socket.off("message_error", onMessageError);
    };
  }, [roomId, apiCurrentId, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  const lastMineId = useMemo(() => [...messages].reverse().find((message) => isMine(message, currentId))?._id, [messages, currentId]);

  const send = async () => {
    if (!text.trim()) return;
    if (blockedByMe) {
      setComposerNote("Bạn đã chặn người dùng này.");
      return;
    }
    if (blockedByOther) {
      setComposerNote("Bạn đã bị chặn.");
      return;
    }
    if (generallyBlocked) {
      setComposerNote("Chat đã khóa.");
      return;
    }
    const content = text.trim();
    setComposerNote("");
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
      socket.emit("typing_stop", { roomId });
      socket.emit("send_message", { roomId, text: content });
      return;
    }
    try {
      const { data } = await api.post(`/chat/${roomId}/messages`, { text: content });
      setMessages((list) => [...list.filter((m) => m._id !== temp._id), data.message]);
    } catch (e: any) {
      setMessages((list) => list.filter((m) => m._id !== temp._id));
      setComposerNote(e.response?.data?.message ?? "Không gửi được tin nhắn.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setComposerNote("File quá lớn (tối đa 20MB).");
      return;
    }
    setUploading(true);
    setComposerNote("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/upload/chat-file", formData);
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("send_message", { roomId, text: "", type: data.type, fileUrl: data.url, fileName: data.fileName });
      } else {
        await api.post(`/chat/${roomId}/messages`, { text: "", type: data.type, fileUrl: data.url, fileName: data.fileName });
        // Optional: Trigger a refresh or manually add to messages, but usually socket is connected.
      }
    } catch (e: any) {
      setComposerNote(e.response?.data?.message ?? "Không tải lên được file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const report = async () => {
    if (!partnerId || !reason.trim()) return;
    setReportSubmitting(true);
    setReportError("");
    try {
      const evidenceUrls: string[] = [];
      if (evidenceFile) {
        const formData = new FormData();
        formData.append("file", evidenceFile);
        const { data } = await api.post("/upload/report-evidence", formData);
        evidenceUrls.push(data.url);
      }
      await api.post("/safety/report", {
        reportedUser: partnerId,
        match: typeof room?.match === "string" ? room.match : room?.match?._id,
        room: roomId,
        reason: reason.trim(),
        incidentAt: incidentAt ? new Date(incidentAt).toISOString() : undefined,
        evidenceUrls
      });
      setNotice("Đã gửi report cho admin.");
      setReportOpen(false);
      setReason("");
      setIncidentAt("");
      setEvidenceFile(null);
      setEvidencePreview("");
    } catch (error: any) {
      setReportError(error.response?.data?.message ?? "Không thể gửi report. Vui lòng thử lại.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const block = async () => {
    if (!partnerId) return;
    await api.post("/safety/block", { targetUserId: partnerId });
    setRoom((value) => value ? { ...value, status: "blocked" } : value);
    setBlockState({ blockedByMe: true, blockedByOther: false });
    setComposerNote("");
  };

  const unblock = async () => {
    if (!partnerId) return;
    const { data } = await api.post("/safety/unblock", { targetUserId: partnerId });
    setBlockState((state) => ({ ...state, blockedByMe: false }));
    if (!blockedByOther) setRoom((value) => value ? { ...value, status: "active" } : value);
    setComposerNote("");
    setNotice(data.message ?? "Đã bỏ chặn người dùng.");
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
                <p className="text-xs font-semibold text-coffee/55">Đang trò chuyện</p>
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
            {blockedByMe ? (
              <Button variant="ghost" icon={<Unlock />} onClick={unblock}>Bỏ chặn</Button>
            ) : (
              <Button variant="danger" icon={<Ban />} onClick={block} />
            )}
          </div>
        </div>
      </header>

      {notice ? <p className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-5xl rounded-lg bg-mint p-3 text-sm font-bold text-cocoa">{notice}</p> : null}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-1 overflow-y-auto p-4">
        {blockedByMe ? (
          <div className="my-3 flex justify-center gap-2">
            <span className="rounded-full bg-coffee/10 px-4 py-2 text-sm font-bold text-coffee">Bạn đã chặn người dùng này.</span>
            <button type="button" onClick={unblock} className="rounded-full bg-white px-4 py-2 text-sm font-black text-caramel shadow-sm">
              Bỏ chặn
            </button>
          </div>
        ) : null}
        {generallyBlocked ? (
          <div className="my-3 flex justify-center">
            <span className="rounded-full bg-coffee/10 px-4 py-2 text-sm font-bold text-coffee">Chat đã khóa.</span>
          </div>
        ) : null}
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
                    {message.type === "image" && message.fileUrl ? (
                      <a href={message.fileUrl} target="_blank" rel="noreferrer">
                        <img src={message.fileUrl} alt="attachment" className="max-h-60 w-auto rounded-lg object-contain" />
                      </a>
                    ) : message.type === "video" && message.fileUrl ? (
                      <video src={message.fileUrl} controls className="max-h-60 w-auto rounded-lg" />
                    ) : message.type === "file" && message.fileUrl ? (
                      <a href={message.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-black/5 p-2 transition hover:bg-black/10">
                        <FileText className="h-6 w-6 shrink-0" />
                        <span className="truncate text-sm font-semibold underline underline-offset-2">{message.fileName || "Tải xuống file"}</span>
                      </a>
                    ) : null}
                    {message.text ? <p className="whitespace-pre-wrap break-words">{message.text}</p> : null}
                  </div>
                  {showStatus ? <span className="mt-1 pr-1 text-[11px] font-semibold text-coffee/55">{statusFor(message, partnerId)}</span> : null}
                </div>
              </motion.div>
            );
          })}
          {typing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-3 flex items-end gap-2 justify-start">
              <div className="w-8 shrink-0">
                <Avatar user={partner} size="sm" />
              </div>
              <div className="flex max-w-[72%] flex-col items-start">
                <div className="rounded-[1.35rem] rounded-bl-md bg-white px-4 py-3.5 shadow-sm">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coffee/40" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coffee/40" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coffee/40" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={scrollRef} />
      </main>

      <footer className="border-t border-coffee/10 bg-white p-3">
        <div className="mx-auto flex max-w-5xl gap-2">
          <div className="relative flex w-full flex-1 gap-2 rounded-full border border-coffee/20 bg-white px-2 py-1 shadow-inner focus-within:border-caramel/50 focus-within:ring-2 focus-within:ring-caramel/10">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <button
              type="button"
              className="ml-1 shrink-0 p-2 text-coffee/40 hover:text-caramel disabled:opacity-50"
              disabled={inputDisabled || uploading}
              onClick={() => setShowEmoji(!showEmoji)}
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="shrink-0 p-2 text-coffee/40 hover:text-caramel disabled:opacity-50"
              disabled={inputDisabled || uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={text}
              disabled={inputDisabled || uploading}
              placeholder={uploading ? "Đang tải lên..." : blockedByMe ? "Bạn đã chặn người dùng này" : blockedByOther ? "Bạn đã bị chặn" : generallyBlocked ? "Chat đã khóa" : "Nhắn tin để chốt thời gian cafe"}
              onChange={(e) => {
                setText(e.target.value);
                setComposerNote("");
                const socket = getSocket();
                if (!inputDisabled) {
                  socket.emit("typing_start", { roomId });
                  if ((window as any).typingTimeoutPrivate) clearTimeout((window as any).typingTimeoutPrivate);
                  (window as any).typingTimeoutPrivate = setTimeout(() => socket.emit("typing_stop", { roomId }), 2000);
                }
              }}
              onBlur={() => !inputDisabled && getSocket().emit("typing_stop", { roomId })}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="min-w-0 flex-1 border-none bg-transparent p-2 text-[15px] outline-none ring-0 placeholder:text-coffee/30 focus:ring-0"
            />
            {showEmoji && !inputDisabled && (
              <div ref={pickerRef} className="absolute bottom-full left-0 z-50 mb-2">
                <EmojiPicker
                  theme={Theme.LIGHT}
                  emojiVersion="12.0"
                  onEmojiClick={(e) => setText((t) => t + e.emoji)}
                  lazyLoadEmojis={true}
                  searchDisabled={true}
                  skinTonesDisabled={true}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
          <Button icon={<Send />} onClick={send} disabled={!text.trim() || inputDisabled} className="shrink-0 rounded-full px-5">Gửi</Button>
        </div>
        {composerNote ? <p className="mx-auto mt-2 max-w-5xl text-center text-xs font-bold text-rose-600">{composerNote}</p> : null}
      </footer>

      {reportOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-cocoa/55 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Report người dùng</h2>
                <p className="mt-1 text-sm text-coffee/70">Admin có thể xem hội thoại gốc để xác minh report.</p>
              </div>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-lg text-coffee/55 hover:bg-latte" onClick={() => setReportOpen(false)} aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-bold text-cocoa">Lý do <span className="text-rose-600">*</span></label>
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-lg border border-coffee/15 px-4 py-3 outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/15"
              placeholder="Mô tả hành vi bạn muốn báo cáo"
              value={reason}
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
            />

            <label className="mt-4 block text-sm font-bold text-cocoa">Thời điểm xảy ra <span className="font-normal text-coffee/50">(không bắt buộc)</span></label>
            <Input className="mt-2" type="datetime-local" value={incidentAt} onChange={(event) => setIncidentAt(event.target.value)} />

            <label className="mt-4 block text-sm font-bold text-cocoa">Ảnh chứng minh <span className="font-normal text-coffee/50">(không bắt buộc)</span></label>
            {evidencePreview ? (
              <div className="relative mt-2 overflow-hidden rounded-lg border border-coffee/10 bg-latte">
                <img src={evidencePreview} alt="Ảnh chứng minh" className="max-h-56 w-full object-contain" />
                <button
                  type="button"
                  className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-coffee shadow-sm"
                  aria-label="Bỏ ảnh"
                  onClick={() => {
                    URL.revokeObjectURL(evidencePreview);
                    setEvidenceFile(null);
                    setEvidencePreview("");
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-caramel/45 bg-latte/45 px-4 py-5 text-sm font-bold text-coffee transition hover:bg-latte">
                <ImagePlus className="h-5 w-5 text-caramel" />
                Chọn ảnh từ thiết bị
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setReportError("Ảnh chứng minh tối đa 5MB.");
                      return;
                    }
                    setReportError("");
                    setEvidenceFile(file);
                    setEvidencePreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            )}

            {reportError ? <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{reportError}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" disabled={reportSubmitting} onClick={() => setReportOpen(false)}>Hủy</Button>
              <Button variant="danger" onClick={report} disabled={!reason.trim() || reportSubmitting}>{reportSubmitting ? "Đang gửi..." : "Gửi report"}</Button>
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
// Hoangswd update code chat room
