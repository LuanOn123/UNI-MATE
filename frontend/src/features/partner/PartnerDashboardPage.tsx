import { motion, AnimatePresence } from "framer-motion";
import { Plus, Store, Ticket, Trash2, X, Check, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";

type Place = {
  _id: string;
  name: string;
  address: string;
  status: string;
  cafeVibe: string;
};

type Voucher = {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  maxUsageCount: number;
  currentUsageCount: number;
  expiresAt: string;
  isActive: boolean;
};

export function PartnerDashboardPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Voucher form
  const [vForm, setVForm] = useState({
    code: "",
    title: "",
    description: "",
    discountPercent: 10,
    maxUsageCount: 0,
    expiresAt: ""
  });

  const fetchPlaces = async () => {
    try {
      const { data } = await api.get("/partner/places");
      setPlaces(data.places);
      if (data.places.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(data.places[0]._id);
      }
    } catch {
      setError("Không tải được danh sách quán.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVouchers = async (placeId: string) => {
    try {
      const { data } = await api.get(`/partner/places/${placeId}/vouchers`);
      setVouchers(data.vouchers);
    } catch {
      setError("Không tải được danh sách voucher.");
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) fetchVouchers(selectedPlaceId);
  }, [selectedPlaceId]);

  const handleCreateVoucher = async () => {
    if (!selectedPlaceId) return;
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/partner/places/${selectedPlaceId}/vouchers`, vForm);
      setShowVoucherModal(false);
      setVForm({ code: "", title: "", description: "", discountPercent: 10, maxUsageCount: 0, expiresAt: "" });
      fetchVouchers(selectedPlaceId);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tạo được voucher.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleVoucher = async (id: string) => {
    try {
      await api.patch(`/partner/vouchers/${id}/toggle`);
      if (selectedPlaceId) fetchVouchers(selectedPlaceId);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Lỗi cập nhật voucher.");
    }
  };

  const deleteVoucher = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa voucher này?")) return;
    try {
      await api.delete(`/partner/vouchers/${id}`);
      if (selectedPlaceId) fetchVouchers(selectedPlaceId);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Lỗi xóa voucher.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-caramel border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-cocoa">Quản lý Đối Tác</h1>
          <p className="text-sm text-coffee/60">Quản lý quán cafe và mã giảm giá của bạn</p>
        </div>
        <Button onClick={() => window.location.href = "/app/partner-register"} icon={<Plus className="h-4 w-4" />}>
          Đăng ký quán mới
        </Button>
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {places.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white py-16 shadow-soft">
          <Store className="h-16 w-16 text-coffee/20" />
          <p className="font-semibold text-coffee/50">Bạn chưa đăng ký quán nào</p>
          <Button onClick={() => window.location.href = "/app/partner-register"} variant="ghost">Đăng ký ngay</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Cột 1: Danh sách quán */}
          <div className="space-y-3">
            <h2 className="font-bold text-coffee">Danh sách quán</h2>
            {places.map((p) => (
              <button
                key={p._id}
                onClick={() => setSelectedPlaceId(p._id)}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  selectedPlaceId === p._id ? "border-caramel bg-latte shadow-sm" : "border-coffee/10 bg-white hover:bg-cream"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-cocoa">{p.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-coffee/60">{p.address}</p>
              </button>
            ))}
          </div>

          {/* Cột 2: Quản lý Voucher của quán được chọn */}
          {selectedPlaceId && (
            <div className="rounded-xl border border-coffee/10 bg-white p-5 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-black text-cocoa">
                  <Ticket className="h-5 w-5 text-caramel" />
                  Mã giảm giá (Vouchers)
                </h2>
                <Button variant="ghost" onClick={() => setShowVoucherModal(true)} icon={<Plus className="h-4 w-4" />}>
                  Tạo mã
                </Button>
              </div>

              {vouchers.length === 0 ? (
                <p className="py-8 text-center text-sm text-coffee/50">Chưa có mã giảm giá nào cho quán này.</p>
              ) : (
                <div className="space-y-3">
                  {vouchers.map((v) => (
                    <div key={v._id} className={`flex items-center justify-between rounded-lg border p-4 ${v.isActive ? 'border-coffee/15 bg-white' : 'border-coffee/5 bg-gray-50 opacity-75'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-caramel px-2 py-1 text-xs font-black tracking-wider text-white">{v.code}</span>
                          <span className="text-sm font-bold text-cocoa">Giảm {v.discountPercent}%</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-coffee/80">{v.title}</p>
                        <p className="mt-1 text-xs text-coffee/50">
                          Đã dùng: {v.currentUsageCount}{v.maxUsageCount ? `/${v.maxUsageCount}` : " (Không giới hạn)"} • Hạn: {new Date(v.expiresAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleVoucher(v._id)} title={v.isActive ? "Tạm dừng" : "Kích hoạt"} className={`rounded p-2 transition ${v.isActive ? "bg-rose-50 text-rose-500 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                          {v.isActive ? <XCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button onClick={() => deleteVoucher(v._id)} title="Xóa" className="rounded bg-gray-100 p-2 text-coffee/40 transition hover:bg-gray-200 hover:text-coffee">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tạo Voucher Modal */}
      <AnimatePresence>
        {showVoucherModal && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-cocoa/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-cocoa">Tạo mã giảm giá mới</h3>
                <button onClick={() => setShowVoucherModal(false)} className="text-coffee/50 hover:text-coffee"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-coffee">Mã Code (VD: UNIMATE20)</label>
                  <Input placeholder="Mã Code" value={vForm.code} onChange={(e) => setVForm({ ...vForm, code: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-coffee">Tiêu đề (VD: Giảm 20% cho thành viên UNI-MATE)</label>
                  <Input placeholder="Tiêu đề hiển thị" value={vForm.title} onChange={(e) => setVForm({ ...vForm, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-coffee">% Giảm giá</label>
                    <Input type="number" min="1" max="100" value={vForm.discountPercent} onChange={(e) => setVForm({ ...vForm, discountPercent: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-coffee">Giới hạn số lượt (0 = Vô hạn)</label>
                    <Input type="number" min="0" value={vForm.maxUsageCount} onChange={(e) => setVForm({ ...vForm, maxUsageCount: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-coffee">Mô tả chi tiết (Tùy chọn)</label>
                  <Input placeholder="Áp dụng cho hóa đơn từ 100k..." value={vForm.description} onChange={(e) => setVForm({ ...vForm, description: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-coffee">Ngày hết hạn</label>
                  <Input type="date" value={vForm.expiresAt} onChange={(e) => setVForm({ ...vForm, expiresAt: e.target.value })} />
                </div>
                <Button onClick={handleCreateVoucher} disabled={actionLoading} className="w-full">
                  {actionLoading ? "Đang tạo..." : "Tạo Mã"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
