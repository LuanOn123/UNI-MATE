import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, UserPlus, LogOut, Trash2, Crown, X, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

type Member = {
  _id: string;
  displayName?: string;
  avatarUrl?: string;
  age?: number;
  school?: string;
  major?: string;
};

type Group = {
  _id: string;
  name: string;
  description?: string;
  creator: Member;
  members: Member[];
  purpose: string;
  maxMembers: number;
  status: string;
};

const purposeLabels: Record<string, string> = {
  study_buddy: "Tìm cạ học bài",
  cafe_chat: "Đi cafe chém gió",
  boardgame_sport: "Boardgame/Thể thao",
  dating: "Hẹn hò",
  other: "Khác"
};

export function GroupPage() {
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupPurpose, setNewGroupPurpose] = useState("cafe_chat");
  const [memberEmail, setMemberEmail] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get("/groups");
      setGroups(data.groups);
    } catch {
      setError("Không tải được danh sách nhóm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!newGroupName.trim()) return setError("Tên nhóm không được trống.");
    setActionLoading(true);
    setError("");
    try {
      await api.post("/groups", { name: newGroupName, description: newGroupDesc, purpose: newGroupPurpose });
      setShowCreate(false);
      setNewGroupName("");
      setNewGroupDesc("");
      await fetchGroups();
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tạo được nhóm.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (groupId: string) => {
    if (!memberEmail.trim()) return setError("Email không được trống.");
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/groups/${groupId}/members`, { email: memberEmail });
      setShowAddMember(null);
      setMemberEmail("");
      await fetchGroups();
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không thêm được thành viên.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    setActionLoading(true);
    setError("");
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      await fetchGroups();
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không xóa được thành viên.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDissolve = async (groupId: string) => {
    if (!confirm("Bạn có chắc muốn giải tán nhóm này?")) return;
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/groups/${groupId}/dissolve`);
      await fetchGroups();
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không giải tán được nhóm.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async (groupId: string) => {
    if (!confirm("Bạn có chắc muốn rời nhóm này?")) return;
    setActionLoading(true);
    setError("");
    try {
      await api.delete(`/groups/${groupId}/members/${user?.id ?? user?._id}`);
      await fetchGroups();
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không rời được nhóm.");
    } finally {
      setActionLoading(false);
    }
  };

  const myId = user?.id ?? user?._id;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-caramel border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-coffee text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-cocoa">Nhóm của tôi</h1>
            <p className="text-sm text-coffee/60">{groups.length} nhóm đang hoạt động</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<Plus className="h-4 w-4" />}>
          Tạo nhóm
        </Button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {/* Create group modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl border border-coffee/10 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-cocoa">Tạo nhóm mới</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-coffee/50 hover:text-coffee"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Tên nhóm *" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
              <Input placeholder="Mô tả nhóm (tuỳ chọn)" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
              <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={newGroupPurpose} onChange={(e) => setNewGroupPurpose(e.target.value)}>
                {Object.entries(purposeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Button onClick={handleCreate} disabled={actionLoading}>{actionLoading ? "Đang tạo..." : "Tạo nhóm"}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups list */}
      {groups.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white py-16 shadow-soft">
          <Users className="h-16 w-16 text-coffee/20" />
          <p className="font-semibold text-coffee/50">Bạn chưa tham gia nhóm nào</p>
          <Button onClick={() => setShowCreate(true)} icon={<Plus className="h-4 w-4" />} variant="ghost">Tạo nhóm đầu tiên</Button>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((group) => {
          const isCreator = String(group.creator._id) === myId;
          return (
            <motion.div key={group._id} layout className="overflow-hidden rounded-xl border border-coffee/8 bg-white shadow-soft">
              {/* Group header */}
              <div className="flex items-center justify-between border-b border-coffee/6 bg-cream/40 px-5 py-4">
                <div>
                  <h3 className="flex items-center gap-2 font-black text-cocoa">
                    {group.name}
                    <span className="rounded-full bg-latte px-2 py-0.5 text-xs font-semibold text-coffee">{purposeLabels[group.purpose] ?? group.purpose}</span>
                  </h3>
                  {group.description && <p className="mt-0.5 text-sm text-coffee/60">{group.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Link to={`/app/groups/${group._id}/chat`} className="rounded-lg border border-caramel bg-caramel p-2 text-white transition hover:bg-caramel/90 shadow-soft" title="Chat nhóm">
                    <MessageCircle className="h-4 w-4" />
                  </Link>
                  {isCreator && (
                    <>
                      <button type="button" onClick={() => { setShowAddMember(group._id); setMemberEmail(""); setError(""); }} className="rounded-lg border border-coffee/10 bg-white p-2 text-coffee transition hover:bg-cream" title="Thêm thành viên">
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDissolve(group._id)} className="rounded-lg border border-rose-200 bg-white p-2 text-rose-500 transition hover:bg-rose-50" title="Giải tán nhóm">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {!isCreator && (
                    <button type="button" onClick={() => handleLeave(group._id)} className="rounded-lg border border-coffee/10 bg-white p-2 text-coffee transition hover:bg-cream" title="Rời nhóm">
                      <LogOut className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Add member inline form */}
              <AnimatePresence>
                {showAddMember === group._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-coffee/6 bg-latte/30 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Email thành viên mới" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
                      <Button onClick={() => handleAddMember(group._id)} disabled={actionLoading}>Thêm</Button>
                      <button type="button" onClick={() => setShowAddMember(null)} className="text-coffee/40 hover:text-coffee"><X className="h-5 w-5" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Members list */}
              <div className="divide-y divide-coffee/6 px-5">
                {group.members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-cream text-xs font-bold text-coffee">{(member.displayName ?? "?")[0]}</div>
                      )}
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-cocoa">
                          {member.displayName ?? "Ẩn danh"}
                          {String(group.creator._id) === String(member._id) && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        </p>
                        <p className="text-xs text-coffee/50">
                          {[member.school, member.major, member.age ? `${member.age} tuổi` : ""].filter(Boolean).join(" · ") || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                    {isCreator && String(member._id) !== myId && (
                      <button type="button" onClick={() => handleRemoveMember(group._id, member._id)} className="rounded p-1 text-coffee/30 transition hover:bg-rose-50 hover:text-rose-500" title="Xóa thành viên">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-cream/30 px-5 py-2 text-right text-xs text-coffee/40">
                {group.members.length}/{group.maxMembers} thành viên
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
