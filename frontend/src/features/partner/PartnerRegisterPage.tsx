import { motion } from "framer-motion";
import { Building2, CheckCircle, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { cities, districtsFor, findLocation, locationChoices } from "../../utils/locationOptions";

const vibeOptions = [
  { value: "quiet_study", label: "Yên tĩnh học bài", desc: "Có ổ cắm, wifi mạnh, không gian tập trung" },
  { value: "acoustic_view", label: "Acoustic / View đẹp", desc: "Nhạc acoustic, view sống ảo, không gian mở" },
  { value: "boardgame_lively", label: "Boardgame / Náo nhiệt", desc: "Có boardgame, sôi động, dễ phá băng" }
];

export function PartnerRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    cafeVibe: "",
    city: "TP.HCM",
    district: locationChoices[0].label,
    tags: [] as string[],
    amenities: [] as string[],
    openingHours: "",
    partnerName: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedLocation = findLocation(form.district);
  const districtChoices = districtsFor(form.city);

  const tagOptions = ["study", "wifi", "quiet", "chill", "boardgame", "acoustic", "view", "power", "pet_friendly", "outdoor"];
  const amenityOptions = ["wifi", "power", "parking", "air_con", "pet_friendly", "outdoor_seating"];

  const toggleTag = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Tên quán là bắt buộc.");
    if (!form.cafeVibe) return setError("Vui lòng chọn phong cách quán.");
    if (!form.partnerName.trim()) return setError("Tên chủ quán là bắt buộc.");

    setLoading(true);
    setError("");
    try {
      await api.post("/places/partner-register", {
        name: form.name,
        address: form.address,
        description: form.description,
        cafeVibe: form.cafeVibe,
        tags: form.tags,
        amenities: form.amenities,
        openingHours: form.openingHours,
        partnerName: form.partnerName,
        city: form.city,
        district: selectedLocation.district,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md rounded-xl bg-white p-8 text-center shadow-soft">
          <CheckCircle className="mx-auto h-16 w-16 text-caramel" />
          <h2 className="mt-4 text-2xl font-black text-cocoa">Đăng ký thành công!</h2>
          <p className="mt-2 text-coffee/70">Quán <strong>{form.name}</strong> đã được gửi lên hệ thống. Admin sẽ duyệt và kích hoạt trong vòng 24h.</p>
          <p className="mt-4 text-sm text-coffee/50">Bạn sẽ nhận được thông báo khi quán được duyệt.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-coffee text-white">
          <Building2 />
        </div>
        <div>
          <h1 className="text-xl font-black text-cocoa">Đăng ký Quán Đối Tác</h1>
          <p className="text-sm text-coffee/60">Quán của bạn sẽ xuất hiện trong gợi ý địa điểm hẹn hò</p>
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="space-y-5 rounded-xl border border-coffee/8 bg-white p-5 shadow-soft md:p-7">
        {/* Tên quán & chủ quán */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-coffee">Tên quán *</label>
            <Input placeholder="VD: The Coffee House" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-coffee">Tên chủ quán *</label>
            <Input placeholder="Họ và tên" value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
          </div>
        </div>

        {/* Địa chỉ */}
        <div>
          <label className="mb-1 block text-sm font-bold text-coffee">Địa chỉ cụ thể</label>
          <Input placeholder="123 Nguyễn Huệ, Quận 1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        {/* Vị trí */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-coffee">Thành phố</label>
            <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, district: districtsFor(e.target.value)[0].label })}>
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-coffee">Quận / Khu vực</label>
            <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
              {districtChoices.map((c) => <option key={c.label} value={c.label}>{c.district}</option>)}
            </select>
          </div>
        </div>

        <p className="flex items-center gap-1.5 rounded-lg bg-cream px-3 py-2 text-xs font-semibold text-coffee/60">
          <MapPin className="h-3.5 w-3.5" /> Tọa độ: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
        </p>

        {/* Phong cách quán */}
        <div>
          <label className="mb-2 block text-sm font-bold text-coffee">Phong cách quán *</label>
          <div className="grid gap-3">
            {vibeOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  form.cafeVibe === opt.value ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"
                }`}
              >
                <input type="radio" name="cafeVibe" value={opt.value} checked={form.cafeVibe === opt.value} onChange={() => setForm({ ...form, cafeVibe: opt.value })} className="mt-0.5 accent-caramel" />
                <div>
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-xs text-coffee/50">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-2 block text-sm font-bold text-coffee">Tags (chọn nhiều)</label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setForm({ ...form, tags: toggleTag(form.tags, tag) })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  form.tags.includes(tag) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Tiện ích */}
        <div>
          <label className="mb-2 block text-sm font-bold text-coffee">Tiện ích</label>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((am) => (
              <button
                key={am}
                type="button"
                onClick={() => setForm({ ...form, amenities: toggleTag(form.amenities, am) })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  form.amenities.includes(am) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"
                }`}
              >
                {am}
              </button>
            ))}
          </div>
        </div>

        {/* Mô tả & giờ mở cửa */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-coffee">Giờ mở cửa</label>
            <Input placeholder="VD: 7:00 - 22:00" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-coffee">Mô tả ngắn</label>
            <Input placeholder="Đặc điểm nổi bật..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} icon={<Send className="h-4 w-4" />} className="w-full">
          {loading ? "Đang gửi..." : "Gửi đăng ký"}
        </Button>
      </div>
    </div>
  );
}
