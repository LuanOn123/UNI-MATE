import { ArrowLeft, Building2, ImagePlus, RotateCcw, Save, Store } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";

type PartnerPlace = {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  district?: string;
  description?: string;
  openingHours?: string;
  partnerName?: string;
  cafeVibe?: string;
  tags?: string[];
  amenities?: string[];
  status?: string;
  imageUrl?: string;
};

const vibeOptions = [
  { value: "quiet_study", label: "Yên tĩnh học bài" },
  { value: "acoustic_view", label: "Acoustic / View đẹp" },
  { value: "boardgame_lively", label: "Boardgame / Náo nhiệt" }
];

function placePayload(place: PartnerPlace) {
  return {
    name: place.name ?? "",
    partnerName: place.partnerName ?? "",
    address: place.address ?? "",
    city: place.city ?? "",
    district: place.district ?? "",
    cafeVibe: place.cafeVibe ?? "",
    openingHours: place.openingHours ?? "",
    description: place.description ?? "",
    tags: place.tags ?? [],
    amenities: place.amenities ?? [],
    imageUrl: place.imageUrl ?? ""
  };
}

export function PartnerAccountPage() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<PartnerPlace[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<PartnerPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = places.find((place) => place._id === selectedId) ?? places[0];

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/partner/places");
      const list = data.places ?? [];
      setPlaces(list);
      const first = list[0];
      if (first) {
        setSelectedId(first._id);
        setForm(first);
      }
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tải được hồ sơ đối tác.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selected) setForm(selected);
  }, [selectedId]);

  const save = async () => {
    if (!form?._id) return;
    const currentPlace = places.find((place) => place._id === form._id);
    const payload = placePayload(form);
    if (currentPlace && JSON.stringify(payload) === JSON.stringify(placePayload(currentPlace))) {
      setError("");
      setMessage("Chưa có thay đổi mới để lưu.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.patch(`/partner/places/${form._id}`, payload);
      setPlaces((items) => items.map((item) => item._id === data.place._id ? data.place : item));
      setForm(data.place);
      setMessage("Đã lưu hồ sơ quán.");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không lưu được hồ sơ quán.");
    } finally {
      setSaving(false);
    }
  };

  const updateList = (key: "tags" | "amenities", value: string) => {
    if (!form) return;
    setForm({ ...form, [key]: value.split(",").map((item) => item.trim()).filter(Boolean) });
  };

  const uploadPlaceImage = async (file?: File) => {
    if (!file || !form) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await api.post("/users/photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm({ ...form, imageUrl: data.url });
      setMessage("Anh quan da san sang. Bam Luu thay doi de cap nhat cho user va admin.");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Khong tai duoc anh quan.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    const currentPlace = places.find((place) => place._id === form?._id);
    if (currentPlace) {
      setForm(currentPlace);
      setError("");
      setMessage("Da huy cac thay doi chua luu.");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-caramel border-t-transparent" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-soft">
          <Store className="mx-auto h-14 w-14 text-coffee/25" />
          <h1 className="mt-4 text-2xl font-black text-cocoa">Chưa có hồ sơ quán</h1>
          <p className="mt-2 text-sm font-semibold text-coffee/60">Bạn cần có quán được admin duyệt trước khi chỉnh hồ sơ đối tác.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-24 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-coffee text-white">
            <Building2 />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Partner Account</p>
            <h1 className="text-2xl font-black text-cocoa">Hồ sơ quán đối tác</h1>
            <p className="text-sm text-coffee/60">Thông tin này dùng để hiển thị quán và quản lý ưu đãi.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate("/app/partner/dashboard")} icon={<ArrowLeft className="h-4 w-4" />}>
            Thoát
          </Button>
          <Button variant="ghost" onClick={resetForm} icon={<RotateCcw className="h-4 w-4" />}>
            Hoàn tác
          </Button>
          <Button onClick={save} disabled={saving} icon={<Save className="h-4 w-4" />}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <section className="rounded-xl border border-coffee/10 bg-white p-4 shadow-soft">
          <h2 className="mb-3 font-black text-cocoa">Quán của bạn</h2>
          <div className="space-y-2">
            {places.map((place) => (
              <button
                key={place._id}
                type="button"
                onClick={() => setSelectedId(place._id)}
                className={`w-full rounded-lg border p-3 text-left transition ${selectedId === place._id ? "border-caramel bg-latte" : "border-coffee/10 hover:bg-cream"}`}
              >
                <p className="font-bold text-cocoa">{place.name}</p>
                <p className="mt-1 text-xs font-semibold text-coffee/55">{place.status}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-5 rounded-xl border border-coffee/10 bg-white p-5 shadow-soft md:p-7">
          <Field label="Ảnh quán">
            <label className="block cursor-pointer overflow-hidden rounded-xl border border-dashed border-caramel/40 bg-cream transition hover:border-caramel">
              <div
                className="grid min-h-52 place-items-center bg-cover bg-center p-5 text-center"
                style={{ backgroundImage: form.imageUrl ? `linear-gradient(rgba(39, 24, 17, .18), rgba(39, 24, 17, .18)), url(${form.imageUrl})` : undefined }}
              >
                <div className={`rounded-lg px-4 py-3 ${form.imageUrl ? "bg-white/90" : "bg-white"}`}>
                  <ImagePlus className="mx-auto h-7 w-7 text-caramel" />
                  <p className="mt-2 text-sm font-black text-cocoa">{form.imageUrl ? "Đổi ảnh quán" : "Chọn ảnh quán từ máy"}</p>
                  <p className="mt-1 text-xs font-semibold text-coffee/55">Ảnh này sẽ hiện ở trang quán của user và màn hình admin.</p>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPlaceImage(e.target.files?.[0])} />
            </label>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên quán">
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Tên chủ quán">
              <Input value={form.partnerName ?? ""} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
            </Field>
          </div>

          <Field label="Địa chỉ">
            <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Thành phố">
              <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Quận / Khu vực">
              <Input value={form.district ?? ""} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Phong cách quán">
              <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.cafeVibe ?? ""} onChange={(e) => setForm({ ...form, cafeVibe: e.target.value })}>
                <option value="">Chọn phong cách</option>
                {vibeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="Giờ mở cửa">
              <Input value={form.openingHours ?? ""} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
            </Field>
          </div>

          <Field label="Mô tả ngắn">
            <textarea className="min-h-24 w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tags">
              <Input value={(form.tags ?? []).join(", ")} onChange={(e) => updateList("tags", e.target.value)} />
            </Field>
            <Field label="Tiện ích">
              <Input value={(form.amenities ?? []).join(", ")} onChange={(e) => updateList("amenities", e.target.value)} />
            </Field>
          </div>
        </section>
      </div>
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
