import { Ban, CheckCircle, Coffee, ExternalLink, Eye, Flag, History, MapPin, Plus, Save, Search, ShieldAlert, Tags, UserRound, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";

type AnyRecord = Record<string, any>;

const emptyPlace = {
  name: "",
  address: "",
  city: "TP.HCM",
  district: "",
  rating: 4,
  userRatingsTotal: 0,
  priceLevel: "$$",
  status: "active",
  tags: "",
  amenities: "",
  openingHours: "",
  description: "",
  imageUrl: "",
  openNow: true,
  mapsUrl: "",
  location: { type: "Point", coordinates: [106.7009, 10.7769] }
};

function displayUser(user?: AnyRecord) {
  if (!user) return "Không rõ";
  return user.displayName || user.email || user._id;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "";
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AnyRecord>({});
  useEffect(() => { api.get("/admin/dashboard").then((r) => setStats(r.data.stats)); }, []);
  const cards = [
    ["users", "Tổng user", Users],
    ["newUsers", "User mới 7 ngày", UserRound],
    ["matches", "Matches", Coffee],
    ["confirmed", "Đã chốt quán", CheckCircle],
    ["newReports", "Report mới", Flag],
    ["activePlaces", "Quán active", Coffee],
    ["activeRooms", "Chat active", History]
  ];
  return (
    <AdminPageShell eyebrow="Overview" title="Dashboard vận hành">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([key, label, Icon]) => {
          const Component = Icon as any;
          return (
            <section key={String(key)} className="rounded-lg bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500">{String(label)}</p>
                <Component className="h-5 w-5 text-caramel" />
              </div>
              <p className="text-4xl font-black">{stats[String(key)] ?? 0}</p>
            </section>
          );
        })}
      </div>
      <section className="mt-5 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-black">Luồng admin theo PRD</h2>
        <div className="mt-3 grid gap-3 text-sm font-medium text-slate-600 md:grid-cols-3">
          <p>1. Theo dõi KPI demo và report mới.</p>
          <p>2. Quản lý user: xem hồ sơ, suspend hoặc ban có lý do.</p>
          <p>3. Quản lý quán, tags và audit log để bảo đảm dữ liệu sạch.</p>
        </div>
      </section>
    </AdminPageShell>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AnyRecord[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "user",
    status: "active",
    gender: "prefer_not",
    birthDate: "",
    school: "",
    major: ""
  });
  const [createError, setCreateError] = useState("");

  const load = () => api.get("/admin/users", { params: { q: q || undefined, status: status || undefined, role: role || undefined } }).then((r) => setUsers(r.data.users));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, nextStatus: "active" | "suspended" | "banned") => {
    await api.patch(`/admin/users/${id}/status`, { status: nextStatus, reason: `Admin set ${nextStatus}` });
    setMessage("Đã cập nhật trạng thái user.");
    load();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      await api.post("/admin/users", createForm);
      setMessage("Đã tạo người dùng mới thành công.");
      setShowCreateModal(false);
      setCreateForm({
        email: "",
        password: "",
        displayName: "",
        role: "user",
        status: "active",
        gender: "prefer_not",
        birthDate: "",
        school: "",
        major: ""
      });
      load();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Lỗi tạo người dùng");
    }
  };

  return (
    <AdminPageShell eyebrow="Users" title="Quản lý người dùng">
      <AdminToolbar>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-10" placeholder="Tìm email hoặc tên" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        </div>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="user">User</option>
          <option value="partner">Partner</option>
          <option value="admin">Admin</option>
        </select>
        <Button onClick={load}>Lọc</Button>
        <Button onClick={() => setShowCreateModal(true)} icon={<Plus />}>Thêm User</Button>
      </AdminToolbar>
      <Notice message={message} />
      <AdminTable>
        <thead><tr><Th>User</Th><Th>Vai trò</Th><Th>Profile</Th><Th>Status</Th><Th>Created</Th><Th>Action</Th></tr></thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-t">
              <Td><p className="font-bold">{displayUser(user)}</p><p className="text-xs text-slate-500">{user.email}</p></Td>
              <Td><span className="capitalize font-semibold text-xs bg-slate-100 rounded px-2 py-1 text-slate-700">{user.role}</span></Td>
              <Td>{user.age ?? "-"} tuổi · {user.gender ?? "-"} · {user.location?.addressLabel ?? "TP.HCM"}</Td>
              <Td><StatusPill value={user.status} /></Td>
              <Td>{formatDate(user.createdAt)}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/users/${user._id}`}><Button variant="ghost" icon={<Eye />}>Xem</Button></Link>
                  <Button variant="ghost" onClick={() => updateStatus(user._id, "active")}>Active</Button>
                  <Button variant="ghost" onClick={() => updateStatus(user._id, "suspended")}>Suspend</Button>
                  <Button variant="danger" onClick={() => updateStatus(user._id, "banned")}>Ban</Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </AdminTable>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-4">Tạo người dùng mới</h2>
            {createError && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{createError}</p>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email *</label>
                <Input type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu *</label>
                <Input type="password" required value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên hiển thị</label>
                <Input value={createForm.displayName} onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vai trò</label>
                  <select className="w-full rounded-lg border border-slate-200 p-3 text-sm" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                    <option value="user">User</option>
                    <option value="partner">Partner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select className="w-full rounded-lg border border-slate-200 p-3 text-sm" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Giới tính</label>
                  <select className="w-full rounded-lg border border-slate-200 p-3 text-sm" value={createForm.gender} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}>
                    <option value="prefer_not">Không tiết lộ</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <Input type="date" value={createForm.birthDate} onChange={(e) => setCreateForm({ ...createForm, birthDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Trường học</label>
                  <Input value={createForm.school} onChange={(e) => setCreateForm({ ...createForm, school: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Chuyên ngành</label>
                  <Input value={createForm.major} onChange={(e) => setCreateForm({ ...createForm, major: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Hủy</Button>
                <Button type="submit">Xác nhận tạo</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminUserDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<AnyRecord | null>(null);
  const [message, setMessage] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "user",
    status: "active",
    gender: "prefer_not",
    birthDate: "",
    school: "",
    major: ""
  });
  const [editError, setEditError] = useState("");

  useEffect(() => { api.get(`/admin/users/${id}`).then((r) => setData(r.data)); }, [id]);

  const updateStatus = async (status: "active" | "suspended" | "banned") => {
    await api.patch(`/admin/users/${id}/status`, { status, reason: `Admin detail set ${status}` });
    setMessage("Đã cập nhật user.");
    const r = await api.get(`/admin/users/${id}`);
    setData(r.data);
  };

  const openEdit = () => {
    if (!data?.user) return;
    const u = data.user;
    setEditForm({
      email: u.email || "",
      password: "",
      displayName: u.displayName || "",
      role: u.role || "user",
      status: u.status || "active",
      gender: u.gender || "prefer_not",
      birthDate: u.birthDate ? new Date(u.birthDate).toISOString().split("T")[0] : "",
      school: u.school || "",
      major: u.major || ""
    });
    setEditError("");
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    try {
      const payload: any = { ...editForm };
      if (!payload.password) delete payload.password;
      await api.put(`/admin/users/${id}`, payload);
      setMessage("Đã cập nhật thông tin người dùng thành công.");
      setShowEditModal(false);
      const r = await api.get(`/admin/users/${id}`);
      setData(r.data);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Lỗi cập nhật người dùng");
    }
  };

  if (!data) return <AdminPageShell title="Đang tải user" />;
  const user = data.user;
  return (
    <AdminPageShell eyebrow="User detail" title={displayUser(user)}>
      <Notice message={message} />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">{user.email}</p>
              <h2 className="mt-1 text-2xl font-black">{user.displayName || "Chưa đặt tên"}</h2>
              <p className="mt-2 text-slate-600">{user.age ?? "-"} tuổi · {user.zodiac ?? "-"} · {user.gender ?? "-"}</p>
              <p className="text-slate-600">{user.school ?? "Chưa có trường"} · {user.major ?? "Chưa có ngành"}</p>
            </div>
            <StatusPill value={user.status} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(user.onboarding?.cafeStyles ?? []).map((tag: string) => <span key={tag} className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-caramel">{tag}</span>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={openEdit}>Sửa thông tin</Button>
            <Button variant="ghost" onClick={() => updateStatus("active")}>Reactivate</Button>
            <Button variant="ghost" onClick={() => updateStatus("suspended")}>Suspend</Button>
            <Button variant="danger" onClick={() => updateStatus("banned")}>Ban</Button>
          </div>
        </section>
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-black">Ảnh hồ sơ</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[user.avatarUrl, ...(user.profilePhotos ?? [])].filter(Boolean).slice(0, 6).map((url: string, i: number) => <div key={`${url}-${i}`} className="aspect-[3/4] rounded-lg bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />)}
          </div>
        </section>
      </div>
      <section className="mt-5 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-black">Match metadata</h2>
        <CompactList items={data.matches ?? []} empty="Chưa có match" render={(match) => <span>{match.status} · {match.selectedPlace?.name ?? "chưa chọn quán"} · {formatDate(match.createdAt)}</span>} />
      </section>
      <section className="mt-5 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-black">Reports liên quan</h2>
        <CompactList items={data.reports ?? []} empty="Chưa có report" render={(report) => <span>{report.reason} · {report.status} · {formatDate(report.createdAt)}</span>} />
      </section>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-4">Sửa thông tin người dùng</h2>
            {editError && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{editError}</p>}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email *</label>
                <Input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu (để trống nếu không đổi)</label>
                <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên hiển thị</label>
                <Input value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vai trò</label>
                  <select className="w-full rounded-lg border border-slate-200 p-3 text-sm" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="user">User</option>
                    <option value="partner">Partner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select className="w-full rounded-lg border border-slate-200 p-3 text-sm" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Giới tính</label>
                  <select className="w-full rounded-lg border border-slate-200 p-3 text-sm" value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                    <option value="prefer_not">Không tiết lộ</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <Input type="date" value={editForm.birthDate} onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Trường học</label>
                  <Input value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Chuyên ngành</label>
                  <Input value={editForm.major} onChange={(e) => setEditForm({ ...editForm, major: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>Hủy</Button>
                <Button type="submit">Lưu thay đổi</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

export function AdminReportsPage() {
  const [reports, setReports] = useState<AnyRecord[]>([]);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const load = () => api.get("/admin/reports", { params: { status: status || undefined } }).then((r) => setReports(r.data.reports));
  useEffect(() => { load(); }, []);
  const act = async (id: string, action: "dismiss" | "review" | "warn" | "suspend" | "ban") => {
    await api.patch(`/admin/reports/${id}`, { action, note: `Handled as ${action}` });
    setMessage("Đã xử lý report.");
    load();
  };
  return (
    <AdminPageShell eyebrow="Safety" title="Report queue">
      <AdminToolbar>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved_valid">Resolved valid</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <Button onClick={load}>Lọc</Button>
      </AdminToolbar>
      <Notice message={message} />
      <AdminTable>
        <thead><tr><Th>Report</Th><Th>Reporter</Th><Th>Reported</Th><Th>Status</Th><Th>Action</Th></tr></thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report._id} className="border-t align-top">
              <Td><p className="font-bold">{report.reason}</p><p className="text-xs text-slate-500">{report.priority ? "Ưu tiên cao · " : ""}{formatDate(report.createdAt)}</p></Td>
              <Td>{displayUser(report.reporter)}</Td>
              <Td>{displayUser(report.reportedUser)}</Td>
              <Td><StatusPill value={report.status} /></Td>
              <Td><div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => act(report._id, "review")}>Review</Button>
                <Button variant="ghost" onClick={() => act(report._id, "dismiss")}>Dismiss</Button>
                <Button variant="ghost" onClick={() => act(report._id, "warn")}>Warn</Button>
                <Button variant="ghost" onClick={() => act(report._id, "suspend")}>Suspend</Button>
                <Button variant="danger" onClick={() => act(report._id, "ban")}>Ban</Button>
              </div></Td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </AdminPageShell>
  );
}

export function AdminPlacesPage() {
  const [places, setPlaces] = useState<AnyRecord[]>([]);
  const [form, setForm] = useState<AnyRecord>(emptyPlace);
  const [editingId, setEditingId] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<AnyRecord | null>(null);
  const [message, setMessage] = useState("");
  const [q, setQ] = useState("");
  const [statusVal, setStatusVal] = useState("");
  const [district, setDistrict] = useState("");

  const load = () => api.get("/admin/places", { params: { q: q || undefined, status: statusVal || undefined, district: district || undefined } }).then((r) => setPlaces(r.data.places));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editingId) return;
    const payload = {
      ...form,
      rating: Number(form.rating),
      userRatingsTotal: Number(form.userRatingsTotal),
      tags: String(form.tags).split(",").map((x) => x.trim()).filter(Boolean),
      amenities: String(form.amenities).split(",").map((x) => x.trim()).filter(Boolean),
      location: { type: "Point", coordinates: [Number(form.location.coordinates[0]), Number(form.location.coordinates[1])] }
    };
    const { data } = await api.put(`/admin/places/${editingId}`, payload);
    setMessage("Đã cập nhật quán.");
    setEditingId("");
    setForm(emptyPlace);
    setSelectedPlace(data.place);
    load();
  };

  const edit = (place: AnyRecord) => {
    setSelectedPlace(place);
    setEditingId(place._id);
    setForm({ ...emptyPlace, ...place, tags: (place.tags ?? []).join(", "), amenities: (place.amenities ?? []).join(", "), location: place.location ?? emptyPlace.location });
  };
  const view = (place: AnyRecord) => {
    setSelectedPlace(place);
    setEditingId("");
    setForm(emptyPlace);
  };
  const status = async (id: string, next: "active" | "hidden" | "pending") => {
    const { data } = await api.patch(`/admin/places/${id}/status`, { status: next, reason: `Admin set ${next}` });
    setMessage("Đã cập nhật trạng thái quán.");
    setSelectedPlace(data.place);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa quán cafe này không?")) return;
    try {
      await api.delete(`/admin/places/${id}`);
      setMessage("Đã xóa quán cafe thành công.");
      load();
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Lỗi khi xóa quán");
    }
  };

  return (
    <AdminPageShell eyebrow="Places" title="Quản lý quán cafe">
      <AdminToolbar>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-10" placeholder="Tìm tên quán hoặc địa chỉ" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        </div>
        <Input placeholder="Quận/Huyện" className="max-w-[180px]" value={district} onChange={(e) => setDistrict(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" value={statusVal} onChange={(e) => setStatusVal(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
        <Button onClick={load}>Lọc</Button>
      </AdminToolbar>
      <Notice message={message} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <AdminTable>
          <thead><tr><Th>Quán</Th><Th>Partner</Th><Th>Rating</Th><Th>Status</Th><Th>Action</Th></tr></thead>
          <tbody>
            {places.map((place) => (
              <tr key={place._id} className="border-t align-top">
                <Td><p className="font-bold">{place.name}</p><p className="text-xs text-slate-500">{place.address}</p></Td>
                <Td>
                  {place.isPartnerPlace ? (
                    <div>
                      <p className="font-bold text-caramel">Partner place</p>
                      <p className="text-xs text-slate-500">{place.partnerName ?? "Chưa có tên chủ quán"}</p>
                    </div>
                  ) : "-"}
                </Td>
                <Td>{place.rating ?? "N/A"} · {place.priceLevel}</Td>
                <Td><StatusPill value={place.status} /></Td>
                <Td><div className="flex flex-wrap gap-2">
                  <Button variant="ghost" icon={<Eye />} onClick={() => view(place)}>Xem</Button>
                  <Button variant="ghost" onClick={() => edit(place)}>Sửa</Button>
                  <Button variant="ghost" onClick={() => status(place._id, "active")}>{place.status === "pending" ? "Duyệt" : "Show"}</Button>
                  <Button variant="ghost" onClick={() => status(place._id, "hidden")}>{place.status === "pending" ? "Từ chối" : "Hide"}</Button>
                  {place.status !== "pending" ? <Button variant="ghost" onClick={() => status(place._id, "pending")}>Pending</Button> : null}
                </div></Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        <section className="rounded-lg bg-white p-5 shadow-sm">
          {editingId ? (
            <>
              <h2 className="mb-4 flex items-center gap-2 font-black"><Save className="h-5 w-5 text-caramel" />Sửa quán</h2>
              <PlaceForm form={form} setForm={setForm} />
              <div className="mt-4 flex gap-2">
                <Button icon={<Save />} onClick={save}>Lưu sửa</Button>
                <Button variant="ghost" onClick={() => { setEditingId(""); setForm(emptyPlace); }}>Hủy</Button>
              </div>
            </>
          ) : selectedPlace ? (
            <PlaceDetail place={selectedPlace} onEdit={() => edit(selectedPlace)} onStatus={status} />
          ) : (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <Coffee className="mx-auto h-12 w-12 text-slate-300" />
                <h2 className="mt-3 font-black text-slate-700">Chọn một quán để xem chi tiết</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Admin chỉ duyệt, xem và chỉnh sửa quán do partner gửi.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}

export function AdminTagsPage() {
  const [tags, setTags] = useState<AnyRecord[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("cafe");
  const [message, setMessage] = useState("");
  const load = () => api.get("/admin/tags").then((r) => setTags(r.data.tags));
  useEffect(() => { load(); }, []);
  const save = async () => {
    await api.post("/admin/tags", { name, type, status: "active" });
    setName("");
    setMessage("Đã thêm tag.");
    load();
  };
  return (
    <AdminPageShell eyebrow="Tags" title="Quản lý tags">
      <Notice message={message} />
      <AdminToolbar>
        <Input placeholder="Tên tag" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="cafe">Cafe</option>
          <option value="profile">Profile</option>
        </select>
        <Button icon={<Tags />} onClick={save} disabled={!name.trim()}>Thêm tag</Button>
      </AdminToolbar>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tags.map((tag) => <div key={tag._id} className="rounded-lg bg-white p-4 shadow-sm"><p className="font-black">{tag.name}</p><p className="text-sm text-slate-500">{tag.type} · {tag.status}</p></div>)}
      </div>
    </AdminPageShell>
  );
}

export function AdminAuditPage() {
  const [actions, setActions] = useState<AnyRecord[]>([]);
  useEffect(() => { api.get("/admin/actions").then((r) => setActions(r.data.actions)); }, []);
  return (
    <AdminPageShell eyebrow="Audit" title="Audit log">
      <AdminTable>
        <thead><tr><Th>Action</Th><Th>Admin</Th><Th>Target</Th><Th>Reason</Th><Th>Time</Th></tr></thead>
        <tbody>{actions.map((a) => <tr key={a._id} className="border-t"><Td>{a.action}</Td><Td>{displayUser(a.admin)}</Td><Td>{a.targetType} · {a.targetId}</Td><Td>{a.reason}</Td><Td>{formatDate(a.createdAt)}</Td></tr>)}</tbody>
      </AdminTable>
    </AdminPageShell>
  );
}

export function AdminMatchesPage() {
  const [matches, setMatches] = useState<AnyRecord[]>([]);
  useEffect(() => { api.get("/admin/matches").then((r) => setMatches(r.data.matches)); }, []);
  return (
    <AdminPageShell eyebrow="Matches" title="Theo dõi matches">
      <AdminTable>
        <thead><tr><Th>Users</Th><Th>Status</Th><Th>Quán</Th><Th>Score</Th><Th>Created</Th></tr></thead>
        <tbody>{matches.map((m) => <tr key={m._id} className="border-t"><Td>{(m.users ?? []).map(displayUser).join(" ↔ ")}</Td><Td><StatusPill value={m.status} /></Td><Td>{m.selectedPlace?.name ?? "Chưa chọn"}</Td><Td>{m.score ?? 0}</Td><Td>{formatDate(m.createdAt)}</Td></tr>)}</tbody>
      </AdminTable>
    </AdminPageShell>
  );
}

function PlaceDetail({ place, onEdit, onStatus }: { place: AnyRecord; onEdit: () => void; onStatus: (id: string, next: "active" | "hidden" | "pending") => void }) {
  const coords = place.location?.coordinates ?? [];
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-caramel">Chi tiết quán</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">{place.name}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{place.address || "Chưa có địa chỉ"}</p>
        </div>
        <StatusPill value={place.status} />
      </div>
      <div
        className="mb-4 grid h-44 place-items-center rounded-lg bg-slate-100 bg-cover bg-center text-sm font-bold text-slate-500"
        style={{ backgroundImage: place.imageUrl ? `url(${place.imageUrl})` : undefined }}
      >
        {!place.imageUrl ? "Chưa có ảnh quán" : ""}
      </div>
      <div className="grid gap-3 text-sm text-slate-700">
        <DetailRow label="Chủ quán" value={place.partnerName || "Không rõ"} />
        <DetailRow label="Loại hồ sơ" value={place.isPartnerPlace ? "Quán đối tác" : "Dữ liệu hệ thống"} />
        <DetailRow label="Khu vực" value={[place.district, place.city].filter(Boolean).join(", ") || "Chưa cập nhật"} />
        <DetailRow label="Giờ mở cửa" value={place.openingHours || "Chưa cập nhật"} />
        <DetailRow label="Phong cách" value={place.cafeVibe || "Chưa cập nhật"} />
        <DetailRow label="Đánh giá" value={`${place.rating ?? "N/A"} · ${place.userRatingsTotal ?? 0} lượt`} />
        <DetailRow label="Mức giá" value={place.priceLevel || "-"} />
        <DetailRow label="Tọa độ" value={coords.length ? `${coords[1]}, ${coords[0]}` : "Chưa có"} />
      </div>
      {place.description ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-medium leading-relaxed text-slate-600">{place.description}</p> : null}
      {place.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {place.tags.map((tag: string) => <span key={tag} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-caramel">#{tag}</span>)}
        </div>
      ) : null}
      {place.amenities?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {place.amenities.map((item: string) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{item}</span>)}
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onEdit}>Sửa quán</Button>
        <Button variant="ghost" onClick={() => onStatus(place._id, "active")}>{place.status === "pending" ? "Duyệt" : "Hiển thị"}</Button>
        <Button variant="ghost" onClick={() => onStatus(place._id, "hidden")}>{place.status === "pending" ? "Từ chối" : "Ẩn"}</Button>
        {place.mapsUrl ? <a href={place.mapsUrl} target="_blank" rel="noreferrer"><Button variant="ghost" icon={<ExternalLink />}>Maps</Button></a> : null}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-800">{value}</span>
    </p>
  );
}

function PlaceForm({ form, setForm }: { form: AnyRecord; setForm: (value: AnyRecord) => void }) {
  const lng = Number(form.location.coordinates[0]) || 106.7009;
  const lat = Number(form.location.coordinates[1]) || 10.7769;
  const mapsPickerUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const uploadPlaceImage = async (file?: File) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    const { data } = await api.post("/users/photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
    setForm({ ...form, imageUrl: data.url });
  };

  return (
    <div className="grid gap-3">
      <Field label="Ảnh quán" hint="Chọn ảnh từ máy để preview và lưu cùng dữ liệu quán.">
        <label className="block cursor-pointer overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <div className="grid min-h-36 place-items-center bg-cover bg-center p-4 text-center text-sm font-bold text-slate-600" style={{ backgroundImage: form.imageUrl ? `url(${form.imageUrl})` : undefined }}>
            {!form.imageUrl ? "Chọn ảnh quán từ máy" : ""}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPlaceImage(e.target.files?.[0])} />
        </label>
      </Field>
      <Field label="Tên quán" hint="Tên hiển thị trong gợi ý và danh sách quán.">
        <Input placeholder="Ví dụ: The Workshop Coffee" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Địa chỉ" hint="Nên nhập đủ số nhà, đường, phường/quận để user dễ tìm.">
        <Input placeholder="Ví dụ: 27 Ngô Đức Kế, Quận 1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Quận/Khu vực">
          <Input placeholder="Quận 1" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
        </Field>
        <Field label="Mức giá">
          <select className="w-full rounded-lg border border-slate-200 p-3" value={form.priceLevel} onChange={(e) => setForm({ ...form, priceLevel: e.target.value })}><option>$</option><option>$$</option><option>$$$</option><option>$$$$</option></select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Rating" hint="Điểm sao Google/seed. Ví dụ 4.0, 4.5.">
          <Input type="number" min="0" max="5" step="0.1" placeholder="4.0" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
        </Field>
        <Field label="Số đánh giá" hint="Tổng review. Nhập 0 nếu chưa có dữ liệu.">
          <Input type="number" min="0" placeholder="0" value={form.userRatingsTotal} onChange={(e) => setForm({ ...form, userRatingsTotal: e.target.value })} />
        </Field>
      </div>
      <Field label="Tags" hint="Cách nhau bằng dấu phẩy. Ví dụ: yên tĩnh, wifi mạnh, có ổ cắm.">
        <Input placeholder="yên tĩnh, wifi mạnh, có ổ cắm" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
      </Field>
      <Field label="Tiện ích" hint="Cách nhau bằng dấu phẩy. Ví dụ: wifi, ổ cắm, máy lạnh.">
        <Input placeholder="wifi, ổ cắm, máy lạnh" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
      </Field>
      <Field label="Thời gian mở cửa" hint="Chọn khung giờ chuẩn để hệ thống dễ kiểm tra và hiển thị.">
        <select className="w-full rounded-lg border border-slate-200 p-3" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })}>
          <option value="">Chọn thời gian</option>
          <option value="07:00 - 22:00">07:00 - 22:00</option>
          <option value="08:00 - 22:00">08:00 - 22:00</option>
          <option value="08:00 - 23:00">08:00 - 23:00</option>
          <option value="24/7">24/7</option>
        </select>
      </Field>
      <Field label="Google Maps URL" hint="Mở Google Maps, chọn đúng quán rồi dán link chia sẻ vào đây.">
        <div className="grid gap-2">
          <Input placeholder="https://maps.google.com/..." value={form.mapsUrl} onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })} />
          <a href={mapsPickerUrl} target="_blank" rel="noreferrer">
            <Button type="button" variant="ghost" className="w-full" icon={<MapPin />}>Chọn trên Google Maps</Button>
          </a>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Kinh độ">
          <Input type="number" placeholder="106.7009" value={form.location.coordinates[0]} onChange={(e) => setForm({ ...form, location: { ...form.location, coordinates: [Number(e.target.value), form.location.coordinates[1]] } })} />
        </Field>
        <Field label="Vĩ độ">
          <Input type="number" placeholder="10.7769" value={form.location.coordinates[1]} onChange={(e) => setForm({ ...form, location: { ...form.location, coordinates: [form.location.coordinates[0], Number(e.target.value)] } })} />
        </Field>
      </div>
      <Field label="Mô tả" hint="Mô tả ngắn cho user biết vì sao quán phù hợp để gặp mặt.">
        <textarea className="min-h-24 w-full rounded-lg border border-slate-200 p-3 outline-none focus:ring-4 focus:ring-caramel/20" placeholder="Không gian yên tĩnh, phù hợp học nhóm và trò chuyện cuối tuần." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-700">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-500">{hint}</span> : null}
    </label>
  );
}

function AdminPageShell({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <div className="p-4 md:p-6"><p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">{eyebrow}</p><h1 className="mb-5 text-3xl font-black">{title}</h1>{children}</div>;
}
function AdminToolbar({ children }: { children: ReactNode }) { return <div className="mb-4 flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm md:flex-row md:items-center">{children}</div>; }
function AdminTable({ children }: { children: ReactNode }) { return <div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="min-w-[760px] w-full text-left text-sm">{children}</table></div>; }
function Th({ children }: { children: ReactNode }) { return <th className="bg-slate-50 p-3 text-xs font-black uppercase tracking-wide text-slate-500">{children}</th>; }
function Td({ children }: { children: ReactNode }) { return <td className="p-3 align-top text-slate-700">{children}</td>; }
function Notice({ message }: { message: string }) { return message ? <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null; }
function StatusPill({ value }: { value?: string }) {
  const danger = ["banned", "blocked", "new"].includes(value ?? "");
  const warn = ["suspended", "reviewing", "cafe_proposed", "hidden", "pending"].includes(value ?? "");
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${danger ? "bg-rose-50 text-rose-700" : warn ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{value ?? "-"}</span>;
}
function CompactList({ items, empty, render }: { items: AnyRecord[]; empty: string; render: (item: AnyRecord) => ReactNode }) {
  if (!items.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return <div className="grid gap-2">{items.map((item) => <div key={item._id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{render(item)}</div>)}</div>;
}
