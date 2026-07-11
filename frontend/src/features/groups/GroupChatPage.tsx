import { Send, Users, Smile, Paperclip, FileText, Play, MoreVertical, X, Crown, Flag } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuthStore } from "../../stores/authStore";
import type { Message, User } from "../../types";

type Group = {
  _id: string;
  name: string;
  members: User[];
  status: string;
};

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

export function GroupChatPage() {
  const { groupId } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const [apiCurrentId, setApiCurrentId] = useState("");
  const currentId = apiCurrentId || idOf(currentUser);
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const [composerNote, setComposerNote] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
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

  const isMember = useMemo(() => {
    if (!group) return false;
    return group.members.some((m) => idOf(m) === currentId);
  }, [group, currentId]);

  const inputDisabled = !isMember || group?.status === "dissolved";

  useEffect(() => {
    let mounted = true;

    // Fetch group details first
    api.get(`/groups/${groupId}`).then((r) => {
      if (!mounted) return;
      setGroup(r.data.group);
    }).catch((e) => setNotice(e.response?.data?.message ?? "Không tải được thông tin nhóm."));

    // Fetch messages
    api.get(`/groups/${groupId}/messages`).then((r) => {
      if (!mounted) return;
      const serverCurrentId = r.data.currentUserId ?? "";
      setApiCurrentId(serverCurrentId);
      setMessages((r.data.messages ?? []).map((message: UiMessage) => ({
        ...message,
        mine: typeof message.mine === "boolean" ? message.mine : isMine(message, serverCurrentId || idOf(currentUser))
      })));
      getSocket().emit("mark_group_read", { groupId });
    }).catch(() => undefined);

    const socket = getSocket();
    socket.emit("join_group", { groupId });
    
    const onNewMessage = (message: UiMessage) => {
      setMessages((list) => {
        const effectiveCurrentId = apiCurrentId || idOf(currentUser);
        const mine = message.senderId ? String(message.senderId) === effectiveCurrentId : isMine(message, effectiveCurrentId);
        const normalized = { ...message, mine };
        return [...list.filter((m) => !(m.pending && m.text === message.text && isMine(m, effectiveCurrentId) === mine)), normalized];
      });
      const effectiveCurrentId = apiCurrentId || idOf(currentUser);
      const mine = message.senderId ? String(message.senderId) === effectiveCurrentId : isMine(message, effectiveCurrentId);
      if (!mine) socket.emit("mark_group_read", { groupId });
    };
    
    const onRead = (event: { userId: string }) => {
      setMessages((list) => list.map((message) => {
        const readBy = new Set((message.readBy ?? []).map(String));
        readBy.add(event.userId);
        return { ...message, readBy: [...readBy] };
      }));
    };
    
    const onTyping = (event: { userId: string, typing: boolean }) => {
      setTyping((prev) => ({ ...prev, [event.userId]: event.typing }));
    };
    
    socket.on("new_group_message", onNewMessage);
    socket.on("group_message_read", onRead);
    socket.on("group_user_typing", onTyping);
    
    return () => {
      mounted = false;
      socket.off("new_group_message", onNewMessage);
      socket.off("group_message_read", onRead);
      socket.off("group_user_typing", onTyping);
    };
  }, [groupId, apiCurrentId, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  const send = async () => {
    if (!text.trim() || inputDisabled) return;
    const content = text.trim();
    setComposerNote("");
    const temp: UiMessage = {
      _id: `temp-${Date.now()}`,
      room: groupId ?? "",
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
      socket.emit("send_group_message", { groupId, text: content });
      return;
    }
    try {
      const { data } = await api.post(`/groups/${groupId}/messages`, { text: content });
      setMessages((list) => [...list.filter((m) => m._id !== temp._id), data.message]);
    } catch (e: any) {
      setMessages((list) => list.filter((m) => m._id !== temp._id));
      setComposerNote(e.response?.data?.message ?? "Không gửi được tin nhắn.");
    }
  };

  const report = async () => {
    const creatorId = typeof (group as any)?.creator === "string" ? (group as any).creator : (group as any)?.creator?._id;
    if (!creatorId || !reportReason.trim()) return;
    try {
      await api.post("/safety/report", { reportedUser: creatorId, reason: `[Báo cáo Nhóm: ${group?.name}] ${reportReason}` });
      setReportOpen(false);
      setNotice("Đã gửi báo cáo nhóm.");
    } catch (e: any) {
      setNotice(e.response?.data?.message || "Không gửi được báo cáo.");
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
        socket.emit("send_group_message", { groupId, text: "", type: data.type, fileUrl: data.url, fileName: data.fileName });
      } else {
        await api.post(`/groups/${groupId}/messages`, { text: "", type: data.type, fileUrl: data.url, fileName: data.fileName });
      }
    } catch (e: any) {
      setComposerNote(e.response?.data?.message ?? "Không tải lên được file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getSenderName = (sender: any) => {
    if (!sender) return "Ẩn danh";
    if (typeof sender === "string") return sender;
    return sender.displayName ?? "Ẩn danh";
  };
  
  const getSenderAvatar = (sender: any) => {
    if (!sender || typeof sender === "string") return null;
    return sender.avatarUrl;
  };

  const typingUsersCount = Object.values(typing).filter(Boolean).length;

  return (
    <div className="flex h-screen flex-col bg-[#f8efe5]">
      <header className="border-b border-coffee/10 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to="/app/groups" className="text-sm font-bold text-caramel">← Nhóm của tôi</Link>
            <div className="mt-1 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-coffee text-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black">{group?.name || "Group chat"}</h1>
                <p className="text-xs font-semibold text-coffee/55">{group?.members?.length ?? 0} thành viên</p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setReportOpen(true)} className="p-2 text-rose-500/60 hover:text-rose-500 transition rounded-full hover:bg-rose-500/10" title="Báo cáo nhóm">
              <Flag className="h-6 w-6" />
            </button>
            <button type="button" onClick={() => setShowInfo(true)} className="p-2 text-coffee/60 hover:text-coffee transition rounded-full hover:bg-coffee/5" title="Thông tin nhóm">
              <MoreVertical className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-5xl flex-col justify-end space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const mine = message.mine;
              return (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[85%] items-end gap-2 md:max-w-[70%] ${mine ? "flex-row-reverse" : "flex-row"}`}>
                    {!mine && (
                      <div className="shrink-0">
                        {getSenderAvatar(message.sender) ? (
                          <img src={getSenderAvatar(message.sender)} alt="" className="h-8 w-8 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-cream text-xs font-bold text-coffee">
                            {getSenderName(message.sender)[0]}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {!mine && <p className="mb-1 ml-1 text-xs font-semibold text-coffee/50">{getSenderName(message.sender)}</p>}
                      <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${mine ? "rounded-br-sm bg-caramel text-white" : "rounded-bl-sm bg-white text-cocoa"}`}>
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
                        {message.text ? <p className="break-words text-[15px]">{message.text}</p> : null}
                      </div>
                      {message.pending && <p className="mt-1 text-right text-[10px] font-semibold text-coffee/40">Đang gửi...</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {typingUsersCount > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-latte text-caramel">
                  <span className="flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel" style={{ animationDelay: "150ms" }} /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel" style={{ animationDelay: "300ms" }} /></span>
                </div>
                <p className="text-xs font-medium text-coffee/50">Ai đó đang nhắn...</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </main>

      <div className="border-t border-coffee/10 bg-white p-4 pb-safe md:p-6 md:pb-6">
        <div className="mx-auto max-w-5xl">
          {notice && <p className="mb-3 rounded-lg bg-rose-50 p-2 text-center text-sm font-semibold text-rose-500">{notice}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 rounded-2xl bg-cream p-1 shadow-inner"
          >
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
                placeholder={uploading ? "Đang tải lên..." : inputDisabled ? (group?.status === "dissolved" ? "Nhóm đã giải tán." : "Chỉ thành viên mới có thể chat.") : "Viết tin nhắn..."}
                onChange={(e) => {
                  setText(e.target.value);
                  const socket = getSocket();
                  if (socket.connected && !inputDisabled) {
                    socket.emit("group_typing_start", { groupId });
                    if ((window as any).typingTimeout) clearTimeout((window as any).typingTimeout);
                    (window as any).typingTimeout = setTimeout(() => socket.emit("group_typing_stop", { groupId }), 2000);
                  }
                }}
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
              {composerNote && <p className="absolute bottom-full left-0 mb-1 px-3 py-1 text-xs font-medium text-rose-500">{composerNote}</p>}
            </div>
            <Button
              disabled={!text.trim() || inputDisabled}
              className={`shrink-0 rounded-full transition ${text.trim() && !inputDisabled ? "bg-caramel text-white" : "bg-coffee/10 text-coffee/40"}`}
              icon={<Send className="h-4 w-4" />}
            />
          </form>
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-2xl shadow-soft overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-coffee/10 flex items-center justify-between bg-cream/40">
                <h2 className="text-lg font-black text-cocoa">Thông tin nhóm</h2>
                <button type="button" onClick={() => setShowInfo(false)} className="text-coffee/40 hover:text-coffee transition rounded-full hover:bg-coffee/10 p-1">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-coffee text-white shadow-soft">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black text-cocoa text-center">{group?.name}</h3>
                </div>
                
                <div>
                  <h4 className="font-bold text-coffee mb-2">Thành viên ({group?.members?.length ?? 0})</h4>
                  <div className="divide-y divide-coffee/6 border border-coffee/10 rounded-xl overflow-hidden bg-cream/20">
                    {group?.members?.map((member: any) => (
                      <div key={member._id || member.id} className="flex items-center gap-3 p-3 bg-white">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-cream text-sm font-bold text-coffee">
                            {(member.displayName ?? "?")[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-cocoa flex items-center gap-1.5">
                            {member.displayName ?? "Ẩn danh"}
                            {(group as any).creator && String((group as any).creator) === String(member._id) && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                          </p>
                          <p className="text-xs text-coffee/50">
                            {[member.school, member.major, member.age ? `${member.age} tuổi` : ""].filter(Boolean).join(" · ") || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft">
              <h2 className="text-xl font-black text-cocoa">Báo cáo nhóm</h2>
              <p className="mt-2 text-sm font-semibold text-coffee/60">Vui lòng mô tả chi tiết vấn đề bạn gặp phải với nhóm này.</p>
              <textarea
                className="mt-4 w-full rounded-xl border border-coffee/15 bg-cream/30 p-3 text-[15px] outline-none focus:ring-4 focus:ring-caramel/20"
                rows={4}
                placeholder="Lý do báo cáo..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <div className="mt-5 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setReportOpen(false)}>Hủy</Button>
                <Button variant="danger" disabled={!reportReason.trim()} onClick={report}>Gửi báo cáo</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
