import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Clock, ImageIcon, LogOut, MapPin, Plus, Store, Ticket, Trash2, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

type Place = {
  _id: string;
  name: string;
  address?: string;
  status: string;
  cafeVibe?: string;
  district?: string;
  city?: string;
  description?: string;
  openingHours?: string;
  tags?: string[];
  amenities?: string[];
  imageUrl?: string;
};

type Voucher = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  discountPercent: number;
  minOrderValue?: number;
  terms?: string;
  maxUsageCount: number;
  currentUsageCount: number;
  expiresAt: string;
  isActive: boolean;
};

const vibeLabel: Record<string, string> = {
  quiet_study: "Yên tĩnh học bài",
  acoustic_view: "Acoustic / View đẹp",
  boardgame_lively: "Boardgame / Náo nhiệt"
};

export function PartnerDashboardPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [place, setPlace] = useState<Place | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(user?.role === "partner");
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [vForm, setVForm] = useState({
    code: "",
    title: "",
    description: "",
    discountPercent: 10,
    minOrderValue: 0,
    maxUsageCount: 0,
    terms: "",
    expiresAt: ""
  });

  const activeVouchers = useMemo(() => vouchers.filter((voucher) => voucher.isActive).length, [vouchers]);
  const totalUsage = useMemo(() => vouchers.reduce((sum, voucher) => sum + (voucher.currentUsageCount ?? 0), 0), [vouchers]);
  const totalLimit = useMemo(() => vouchers.reduce((sum, voucher) => sum + (voucher.maxUsageCount > 0 ? voucher.maxUsageCount : 0), 0), [vouchers]);
  const expiringSoon = useMemo(() => {
    const now = Date.now();
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;
    return vouchers.filter((voucher) => {
      const expiresAt = new Date(voucher.expiresAt).getTime();
      return voucher.isActive && expiresAt >= now && expiresAt <= nextWeek;
    }).length;
  }, [vouchers]);
  const exhaustedVouchers = useMemo(() => vouchers.filter((voucher) => voucher.maxUsageCount > 0 && voucher.currentUsageCount >= voucher.maxUsageCount).length, [vouchers]);
  const canManageVouchers = place?.status === "active";

  const fetchVouchers = async (placeId: string) => {
    try {
      const { data } = await api.get(`/partner/places/${placeId}/vouchers`);
      setVouchers(data.vouchers ?? []);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tải được danh sách voucher.");
    }
  };

  const fetchPlace = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/partner/places");
      const firstPlace = data.places?.[0] ?? null;
      setPlace(firstPlace);
      if (firstPlace?._id) await fetchVouchers(firstPlace._id);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tải được thông tin quán.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "partner") fetchPlace();
    else setLoading(false);
  }, [user?.role]);

  const handleCreateVoucher = async () => {
    if (!place?._id || !canManageVouchers) return;
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/partner/places/${place._id}/vouchers`, vForm);
      setShowVoucherModal(false);
      setVForm({ code: "", title: "", description: "", discountPercent: 10, minOrderValue: 0, maxUsageCount: 0, terms: "", expiresAt: "" });
      await fetchVouchers(place._id);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tạo được voucher.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleVoucher = async (id: string) => {
    try {
      await api.patch(`/partner/vouchers/${id}/toggle`);
      if (place?._id) await fetchVouchers(place._id);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Lỗi cập nhật voucher.");
    }
  };

  const deleteVoucher = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa voucher này?")) return;
    try {
      await api.delete(`/partner/vouchers/${id}`);
      if (place?._id) await fetchVouchers(place._id);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Lỗi xóa voucher.");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-caramel border-t-transparent" />
      </div>
    );
  }

  if (user?.role !== "partner") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center p-4">
        <div className="rounded-xl border border-coffee/10 bg-white p-7 text-center shadow-soft">
          <Store className="mx-auto h-14 w-14 text-caramel" />
          <h1 className="mt-4 text-2xl font-black text-cocoa">Khu vực dành cho Partner</h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-coffee/65">
            Tài khoản chỉ mở dashboard sau khi hồ sơ quán được admin duyệt.
          </p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-soft">
          <Store className="mx-auto h-14 w-14 text-coffee/25" />
          <h1 className="mt-4 text-2xl font-black text-cocoa">Chưa có hồ sơ quán</h1>
          <p className="mt-2 text-sm font-semibold text-coffee/60">Dashboard sẽ mở sau khi quán được admin duyệt.</p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              onClick={async () => {
                await logout();
                navigate("/auth", { replace: true });
              }}
              icon={<LogOut className="h-4 w-4 text-rose-600" />}
            >
              <span className="text-rose-600 font-bold">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-24 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Partner Dashboard</p>
          <h1 className="text-3xl font-black text-cocoa">{place.name}</h1>
          <p className="text-sm font-semibold text-coffee/60">Quản lý hồ sơ quán và ưu đãi hiển thị cho người dùng UNI-MATE.</p>
        </div>
        <Button
          variant="ghost"
          onClick={async () => {
            await logout();
            navigate("/auth", { replace: true });
          }}
          icon={<LogOut className="h-4 w-4 text-rose-600" />}
        >
          <span className="text-rose-600 font-bold">Đăng xuất</span>
        </Button>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Trạng thái quán" value={place.status === "active" ? "Active" : place.status} tone="emerald" />
        <StatCard label="Voucher đang bật" value={`${activeVouchers}/${vouchers.length}`} tone="caramel" />
        <StatCard label="Lượt đã dùng" value={String(totalUsage)} tone="slate" />
        <StatCard label="Sắp hết hạn" value={String(expiringSoon)} tone={expiringSoon ? "amber" : "slate"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Quota voucher" value={totalLimit ? `${Math.max(totalLimit - totalUsage, 0)} còn lại` : "Không giới hạn"} helper={totalLimit ? `${totalUsage}/${totalLimit} lượt đã dùng` : "Voucher đang để không giới hạn lượt dùng."} />
        <MetricCard label="Voucher hết lượt" value={String(exhaustedVouchers)} helper="Nên tạm dừng hoặc tạo mã mới nếu đã hết slot." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-xl border border-coffee/10 bg-white p-5 shadow-soft">
          <div
            className="mb-5 grid h-44 place-items-center rounded-xl bg-cover bg-center bg-cream text-center"
            style={{ backgroundImage: place.imageUrl ? `linear-gradient(rgba(39, 24, 17, .18), rgba(39, 24, 17, .18)), url(${place.imageUrl})` : undefined }}
          >
            {!place.imageUrl ? (
              <div className="text-coffee/45">
                <ImageIcon className="mx-auto h-9 w-9" />
                <p className="mt-2 text-sm font-black">Chưa có ảnh quán</p>
              </div>
            ) : null}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-black text-cocoa">Hồ sơ quán</h2>
              <p className="mt-1 text-sm font-semibold text-coffee/55">Thông tin chính đã được duyệt.</p>
            </div>
            <Button variant="ghost" onClick={() => window.location.href = "/app/partner/account"}>
              Chỉnh sửa
            </Button>
          </div>
          <div className="mt-5 space-y-4 text-sm font-semibold text-coffee/70">
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Địa chỉ" value={place.address || "Chưa cập nhật"} />
            <InfoRow icon={<Store className="h-4 w-4" />} label="Phong cách" value={vibeLabel[place.cafeVibe ?? ""] ?? "Chưa cập nhật"} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Giờ mở cửa" value={place.openingHours || "Chưa cập nhật"} />
          </div>
          {place.description ? <p className="mt-5 rounded-lg bg-cream p-4 text-sm font-semibold leading-relaxed text-coffee/70">{place.description}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {(place.tags ?? []).map((tag) => <span key={tag} className="rounded-full bg-latte px-3 py-1 text-xs font-black text-cocoa">#{tag}</span>)}
          </div>
        </section>

        <section className="rounded-xl border border-coffee/10 bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-black text-cocoa">
                <Ticket className="h-5 w-5 text-caramel" />
                Voucher / ưu đãi
              </h2>
              <p className="mt-1 text-sm font-semibold text-coffee/55">Tạo mã ưu đãi cho người dùng khi chọn quán.</p>
            </div>
            <Button variant="ghost" onClick={() => setShowVoucherModal(true)} disabled={!canManageVouchers} icon={<Plus className="h-4 w-4" />}>
              Tạo mã
            </Button>
          </div>

          {vouchers.length === 0 ? (
            <div className="grid min-h-44 place-items-center rounded-lg bg-cream/70 p-6 text-center">
              <div>
                <Ticket className="mx-auto h-10 w-10 text-coffee/30" />
                <p className="mt-3 text-sm font-bold text-coffee/55">Chưa có voucher nào.</p>
                <p className="mt-1 text-xs font-semibold text-coffee/45">Tạo mã đầu tiên để thu hút người dùng chọn quán của bạn.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {vouchers.map((voucher) => (
                <div key={voucher._id} className={`flex items-center justify-between rounded-lg border p-4 ${voucher.isActive ? "border-coffee/15 bg-white" : "border-coffee/5 bg-gray-50 opacity-75"}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-caramel px-2 py-1 text-xs font-black tracking-wider text-white">{voucher.code}</span>
                      <span className="text-sm font-bold text-cocoa">Giảm {voucher.discountPercent}%</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-coffee/80">{voucher.title}</p>
                    <p className="mt-1 text-xs text-coffee/50">
                      Đã dùng: {voucher.currentUsageCount}{voucher.maxUsageCount ? `/${voucher.maxUsageCount}` : " (Không giới hạn)"} · Hạn: {new Date(voucher.expiresAt).toLocaleDateString("vi-VN")}
                      {voucher.minOrderValue ? ` · Đơn tối thiểu ${Number(voucher.minOrderValue).toLocaleString("vi-VN")}đ` : ""}
                    </p>
                    {voucher.terms ? <p className="mt-1 text-xs font-semibold text-coffee/45">{voucher.terms}</p> : null}
                    {voucher.maxUsageCount > 0 && voucher.currentUsageCount >= voucher.maxUsageCount ? (
                      <p className="mt-2 inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> Hết lượt sử dụng
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleVoucher(voucher._id)} title={voucher.isActive ? "Tạm dừng" : "Kích hoạt"} className={`rounded p-2 transition ${voucher.isActive ? "bg-rose-50 text-rose-500 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                      {voucher.isActive ? <XCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteVoucher(voucher._id)} title="Xóa" className="rounded bg-gray-100 p-2 text-coffee/40 transition hover:bg-gray-200 hover:text-coffee">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showVoucherModal && (
          <div className="fixed inset-0 z-[60] grid place-items-start justify-items-center overflow-y-auto bg-cocoa/40 p-4 py-6 backdrop-blur-sm md:place-items-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-soft">
              <div className="flex shrink-0 items-center justify-between border-b border-coffee/10 px-5 py-4 md:px-6">
                <h3 className="text-lg font-black text-cocoa">Tạo mã giảm giá mới</h3>
                <button onClick={() => setShowVoucherModal(false)} className="text-coffee/50 hover:text-coffee"><X className="h-5 w-5" /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Mã code">
                    <Input placeholder="UNIMATE20" value={vForm.code} onChange={(e) => setVForm({ ...vForm, code: e.target.value.toUpperCase() })} />
                  </Field>
                  <Field label="Ngày hết hạn">
                    <Input type="date" value={vForm.expiresAt} onChange={(e) => setVForm({ ...vForm, expiresAt: e.target.value })} />
                  </Field>
                  <Field label="Tiêu đề">
                    <Input placeholder="Giảm 20% cho thành viên UNI-MATE" value={vForm.title} onChange={(e) => setVForm({ ...vForm, title: e.target.value })} />
                  </Field>
                  <Field label="% giảm">
                    <Input type="number" min="1" max="100" value={vForm.discountPercent} onChange={(e) => setVForm({ ...vForm, discountPercent: Number(e.target.value) })} />
                  </Field>
                  <Field label="Giới hạn lượt">
                    <Input type="number" min="0" value={vForm.maxUsageCount} onChange={(e) => setVForm({ ...vForm, maxUsageCount: Number(e.target.value) })} />
                  </Field>
                  <Field label="Đơn tối thiểu">
                    <Input type="number" min="0" placeholder="0 = không yêu cầu" value={vForm.minOrderValue} onChange={(e) => setVForm({ ...vForm, minOrderValue: Number(e.target.value) })} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Mô tả">
                      <Input placeholder="Áp dụng cho hóa đơn từ 100k..." value={vForm.description} onChange={(e) => setVForm({ ...vForm, description: e.target.value })} />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Điều kiện sử dụng">
                      <Input placeholder="Ví dụ: Chỉ áp dụng khi đi theo match UNI-MATE" value={vForm.terms} onChange={(e) => setVForm({ ...vForm, terms: e.target.value })} />
                    </Field>
                  </div>
                </div>
              </div>
              <div className="shrink-0 border-t border-coffee/10 px-5 py-4 md:px-6">
                <Button onClick={handleCreateVoucher} disabled={actionLoading} className="w-full md:ml-auto md:w-44">
                  {actionLoading ? "Đang tạo..." : "Tạo mã"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "caramel" | "slate" | "amber" }) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700",
    caramel: "bg-latte text-cocoa",
    slate: "bg-slate-50 text-slate-700",
    amber: "bg-amber-50 text-amber-700"
  }[tone];
  return (
    <div className="rounded-xl border border-coffee/10 bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-coffee/45">{label}</p>
      <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-xl border border-coffee/10 bg-white p-4 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-coffee/45">{label}</p>
      <p className="mt-2 text-xl font-black text-cocoa">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-coffee/55">{helper}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-caramel">{icon}</span>
      <p><span className="text-coffee/45">{label}:</span> {value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-coffee">{label}</span>
      {children}
    </label>
  );
}
