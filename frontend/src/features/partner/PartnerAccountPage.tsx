import { ArrowLeft, Building2, ImagePlus, LogOut, RotateCcw, Save, Store } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

type PartnerPlace = {
  _id: string;
  name: string;
  address?: string;
  streetAddress?: string;
  ward?: string;
  addressNote?: string;
  mapPinNote?: string;
  city?: string;
  district?: string;
  description?: string;
  openingHours?: string;
  partnerName?: string;
  cafeVibe?: string;
  priceLevel?: string;
  tags?: string[];
  amenities?: string[];
  status?: string;
  imageUrl?: string;
};

const vibeOptions = [
  { value: "quiet_study", label: "Học tập & làm việc" },
  { value: "acoustic_view", label: "Trò chuyện & chill" },
  { value: "boardgame_lively", label: "Nhóm bạn & boardgame" }
];

const tagOptions = [
  { value: "quiet", label: "Yên tĩnh" },
  { value: "study", label: "Học bài" },
  { value: "work_friendly", label: "Làm việc" },
  { value: "chill", label: "Chill" },
  { value: "acoustic", label: "Nhạc acoustic" },
  { value: "view", label: "View đẹp" },
  { value: "photo_spot", label: "Chụp ảnh" },
  { value: "boardgame", label: "Boardgame" },
  { value: "group_friendly", label: "Đi nhóm" },
  { value: "date_friendly", label: "Hẹn gặp" }
];

const amenityOptions = [
  { value: "wifi", label: "Wifi" },
  { value: "power", label: "Ổ cắm" },
  { value: "parking", label: "Gửi xe" },
  { value: "air_con", label: "Máy lạnh" },
  { value: "pet_friendly", label: "Cho thú cưng" },
  { value: "outdoor_seating", label: "Chỗ ngồi ngoài trời" }
];

const priceOptions = [
  { value: "$", label: "Dưới 30k/người" },
  { value: "$$", label: "30k - 60k/người" },
  { value: "$$$", label: "60k - 100k/người" },
  { value: "$$$$", label: "Trên 100k/người" }
];

const maxTags = 5;

const timeOptions = Array.from({ length: 19 }, (_, index) => {
  const hour = index + 5;
  return `${String(hour).padStart(2, "0")}:00`;
});

function parseOpeningHours(value?: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/.exec(value?.trim() ?? "");
  if (!match) return { start: "07:00", end: "22:00" };
  return { start: `${match[1]}:${match[2]}`, end: `${match[3]}:${match[4]}` };
}

function minutesOf(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function placePayload(place: PartnerPlace) {
  return {
    name: place.name ?? "",
    partnerName: place.partnerName ?? "",
    address: place.address ?? "",
    streetAddress: place.streetAddress ?? "",
    ward: place.ward ?? "",
    addressNote: place.addressNote ?? "",
    mapPinNote: place.mapPinNote ?? "",
    city: place.city ?? "",
    district: place.district ?? "",
    cafeVibe: place.cafeVibe ?? "",
    priceLevel: place.priceLevel ?? "$$",
    openingHours: place.openingHours ?? "",
    description: place.description ?? "",
    tags: place.tags ?? [],
    amenities: place.amenities ?? [],
    imageUrl: place.imageUrl ?? ""
  };
}

export function PartnerAccountPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [places, setPlaces] = useState<PartnerPlace[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<PartnerPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = places.find((place) => place._id === selectedId) ?? places[0];
  const opening = parseOpeningHours(form?.openingHours);

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
    if (minutesOf(opening.start) >= minutesOf(opening.end)) {
      setMessage("");
      setError("Giờ đóng cửa phải sau giờ mở cửa.");
      return;
    }
    const currentPlace = places.find((place) => place._id === form._id);
    const normalizedForm = { ...form, openingHours: `${opening.start} - ${opening.end}` };
    const payload = placePayload(normalizedForm);
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

  const toggleValue = (key: "tags" | "amenities", value: string, max?: number) => {
    if (!form) return;
    const list = form[key] ?? [];
    if (list.includes(value)) {
      setForm({ ...form, [key]: list.filter((item) => item !== value) });
      return;
    }
    if (max && list.length >= max) return;
    setForm({ ...form, [key]: [...list, value] });
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
      setMessage("Ảnh quán đã sẵn sàng. Bấm Lưu thay đổi để cập nhật cho user và admin.");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tải được ảnh quán.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    const currentPlace = places.find((place) => place._id === form?._id);
    if (currentPlace) {
      setForm(currentPlace);
      setError("");
      setMessage("Đã hủy các thay đổi chưa lưu.");
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
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-24 md:p-6">
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

      <section className="space-y-5 rounded-xl border border-coffee/10 bg-white p-5 shadow-soft md:p-7">
          <div className="flex flex-col gap-4 rounded-xl border border-coffee/10 bg-cream/45 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-caramel">Quán của bạn</p>
              <h2 className="mt-1 text-xl font-black text-cocoa">{form.name || "Hồ sơ quán"}</h2>
              <p className="mt-1 text-sm font-semibold text-coffee/60">Trạng thái: <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{form.status ?? "active"}</span></p>
            </div>
            <label className="block w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-caramel/40 bg-white transition hover:border-caramel md:w-72">
              <div
                className="grid min-h-36 place-items-center bg-cover bg-center p-4 text-center"
                style={{ backgroundImage: form.imageUrl ? `linear-gradient(rgba(39, 24, 17, .18), rgba(39, 24, 17, .18)), url(${form.imageUrl})` : undefined }}
              >
                <div className={`rounded-lg px-4 py-3 ${form.imageUrl ? "bg-white/90" : "bg-cream"}`}>
                  <ImagePlus className="mx-auto h-6 w-6 text-caramel" />
                  <p className="mt-2 text-sm font-black text-cocoa">{form.imageUrl ? "Đổi ảnh quán" : "Chọn ảnh quán"}</p>
                  <p className="mt-1 text-xs font-semibold text-coffee/55">Hiện ở user và admin.</p>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPlaceImage(e.target.files?.[0])} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên quán">
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Tên chủ quán">
              <Input value={form.partnerName ?? ""} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
            </Field>
          </div>

          <section className="rounded-xl border border-coffee/10 bg-cream/45 p-4">
            <h2 className="mb-3 font-black text-cocoa">Địa chỉ kinh doanh</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Số nhà, tên đường">
                <Input value={form.streetAddress ?? form.address ?? ""} onChange={(e) => setForm({ ...form, streetAddress: e.target.value, address: [e.target.value, form.ward, form.district, form.city].filter(Boolean).join(", ") })} />
              </Field>
              <Field label="Phường / Xã">
                <Input value={form.ward ?? ""} onChange={(e) => setForm({ ...form, ward: e.target.value, address: [form.streetAddress ?? form.address, e.target.value, form.district, form.city].filter(Boolean).join(", ") })} />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Thành phố">
                <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value, address: [form.streetAddress ?? form.address, form.ward, form.district, e.target.value].filter(Boolean).join(", ") })} />
              </Field>
              <Field label="Quận / Khu vực">
                <Input value={form.district ?? ""} onChange={(e) => setForm({ ...form, district: e.target.value, address: [form.streetAddress ?? form.address, form.ward, e.target.value, form.city].filter(Boolean).join(", ") })} />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Ghi chú địa chỉ">
                <Input value={form.addressNote ?? ""} onChange={(e) => setForm({ ...form, addressNote: e.target.value })} />
              </Field>
              <Field label="Ghi chú vị trí ghim map">
                <Input value={form.mapPinNote ?? ""} onChange={(e) => setForm({ ...form, mapPinNote: e.target.value })} />
              </Field>
            </div>

            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-coffee/60">
              Địa chỉ hiển thị: {form.address || "Chưa có địa chỉ đầy đủ"}
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Quán phù hợp nhất cho">
              <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.cafeVibe ?? ""} onChange={(e) => setForm({ ...form, cafeVibe: e.target.value })}>
                <option value="">Chọn nhóm phù hợp</option>
                {vibeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="Mức giá trung bình">
              <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.priceLevel ?? "$$"} onChange={(e) => setForm({ ...form, priceLevel: e.target.value })}>
                {priceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="Giờ mở cửa">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={opening.start} onChange={(e) => setForm({ ...form, openingHours: `${e.target.value} - ${opening.end}` })}>
                  {timeOptions.slice(0, -1).map((time) => <option key={time} value={time}>{time}</option>)}
                </select>
                <span className="text-sm font-black text-coffee/45">đến</span>
                <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={opening.end} onChange={(e) => setForm({ ...form, openingHours: `${opening.start} - ${e.target.value}` })}>
                  {timeOptions.slice(1).map((time) => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
              <p className="mt-1 text-xs font-semibold text-coffee/55">Đang chọn: {opening.start} - {opening.end}</p>
            </Field>
          </div>

          <Field label={`Mô tả ngắn (${(form.description ?? "").length}/180)`}>
            <textarea
              className="min-h-24 w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30"
              maxLength={180}
              placeholder="VD: Quán yên tĩnh buổi chiều, bàn rộng, hợp học nhóm 2-4 người."
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={`Đặc trưng nổi bật (${(form.tags ?? []).length}/${maxTags})`}>
              <p className="mb-2 text-xs font-semibold text-coffee/55">Chọn 3-5 điểm giúp user biết quán hợp với kiểu gặp nào.</p>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <button key={tag.value} type="button" onClick={() => toggleValue("tags", tag.value, maxTags)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${(form.tags ?? []).includes(tag.value) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"}`}>
                    {tag.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Tiện ích có tại quán">
              <p className="mb-2 text-xs font-semibold text-coffee/55">Chỉ chọn cơ sở vật chất thật sự có, phần này sẽ hiện trên trang chi tiết quán.</p>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((item) => (
                  <button key={item.value} type="button" onClick={() => toggleValue("amenities", item.value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${(form.amenities ?? []).includes(item.value) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
      </section>
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
