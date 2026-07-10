import { motion } from "framer-motion";
import { Building2, CheckCircle, Clock, HelpCircle, MapPin, Send, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { cities, districtsFor, findLocation, locationChoices } from "../../utils/locationOptions";

const vibeOptions = [
  { value: "quiet_study", label: "Yên tĩnh học bài", desc: "Có ổ cắm, wifi mạnh, không gian tập trung" },
  { value: "acoustic_view", label: "Acoustic / View đẹp", desc: "Nhạc acoustic, view sống ảo, không gian mở" },
  { value: "boardgame_lively", label: "Boardgame / Náo nhiệt", desc: "Có boardgame, sôi động, dễ phá băng" }
];

type PartnerPlace = {
  _id: string;
  name: string;
  address?: string;
  district?: string;
  city?: string;
  status: "pending" | "active" | "hidden";
  cafeVibe?: string;
  partnerName?: string;
  createdAt?: string;
};

export function PartnerRegisterPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
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
  const [application, setApplication] = useState<PartnerPlace | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedLocation = findLocation(form.district);
  const districtChoices = districtsFor(form.city);
  const tagOptions = ["study", "wifi", "quiet", "chill", "boardgame", "acoustic", "view", "power", "pet_friendly", "outdoor"];
  const amenityOptions = ["wifi", "power", "parking", "air_con", "pet_friendly", "outdoor_seating"];

  const toggleTag = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  useEffect(() => {
    let alive = true;
    api.get("/places/my-partner-registration")
      .then((res) => alive && setApplication(res.data.place ?? null))
      .catch(() => undefined)
      .finally(() => alive && setChecking(false));
    return () => { alive = false; };
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Tên quán là bắt buộc.");
    if (!form.cafeVibe) return setError("Vui lòng chọn phong cách quán.");
    if (!form.partnerName.trim()) return setError("Tên chủ quán là bắt buộc.");

    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/places/partner-register", {
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
      setApplication(data.place);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="grid min-h-[70vh] place-items-center p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-caramel border-t-transparent" />
      </div>
    );
  }

  if (tab === "notifications") {
    return (
      <PartnerShell title="Thông báo đối tác" subtitle="Cập nhật về hồ sơ quán sẽ xuất hiện tại đây." icon={<Clock />}>
        <div className="rounded-xl border border-coffee/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-coffee/65">
            Khi admin duyệt hoặc từ chối hồ sơ quán, UNI-MATE sẽ gửi thông báo trong app cho bạn.
          </p>
        </div>
      </PartnerShell>
    );
  }

  if (tab === "support") {
    return (
      <PartnerShell title="Hỗ trợ đối tác" subtitle="Một vài gợi ý để hồ sơ quán được duyệt nhanh hơn." icon={<HelpCircle />}>
        <div className="grid gap-3 rounded-xl border border-coffee/10 bg-white p-6 text-sm font-semibold text-coffee/70 shadow-soft">
          <p>1. Tên quán và địa chỉ nên rõ ràng, dễ tìm.</p>
          <p>2. Chọn đúng phong cách quán: học bài, acoustic/view đẹp hoặc boardgame/náo nhiệt.</p>
          <p>3. Mô tả ngắn nên nói rõ quán phù hợp cho gặp mặt, học nhóm hay chill.</p>
        </div>
      </PartnerShell>
    );
  }

  if (application?.status === "pending" || submitted) {
    const place = application;
    return (
      <PartnerShell title="Hồ sơ quán đang chờ duyệt" subtitle="Bạn đang ở Partner Center, không phải giao diện match của user." icon={<Clock />}>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-xl border border-amber-100 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <Clock />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-600">Pending approval</p>
                <h2 className="mt-1 text-2xl font-black text-cocoa">Admin đang kiểm tra hồ sơ quán</h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-coffee/65">
                  Sau khi quán được duyệt, tài khoản của bạn sẽ chuyển sang role partner và mở dashboard quản lý quán/voucher.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-coffee/10 bg-white p-6 shadow-soft">
            <h3 className="font-black text-cocoa">Hồ sơ đã gửi</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold text-coffee/70">
              <p><span className="text-coffee/45">Quán:</span> {place?.name ?? form.name}</p>
              <p><span className="text-coffee/45">Chủ quán:</span> {place?.partnerName ?? form.partnerName}</p>
              <p><span className="text-coffee/45">Khu vực:</span> {[place?.district, place?.city].filter(Boolean).join(", ") || selectedLocation.district}</p>
              <p><span className="text-coffee/45">Trạng thái:</span> <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">pending</span></p>
            </div>
          </section>
        </div>
      </PartnerShell>
    );
  }

  if (application?.status === "active") {
    return (
      <PartnerShell title="Quán đã được duyệt" subtitle="Tài khoản của bạn đã có quyền Partner." icon={<CheckCircle />}>
        <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-coffee/65">
            <strong>{application.name}</strong> đã được kích hoạt trên UNI-MATE. Bạn có thể vào dashboard để quản lý quán và voucher.
          </p>
          <Button onClick={() => window.location.href = "/app/partner/dashboard"} className="mt-5">
            Vào dashboard partner
          </Button>
        </div>
      </PartnerShell>
    );
  }

  if (application?.status === "hidden") {
    return (
      <PartnerShell title="Hồ sơ quán chưa được duyệt" subtitle="Bạn có thể kiểm tra lại thông tin và liên hệ admin để được hỗ trợ." icon={<XCircle />}>
        <div className="rounded-xl border border-rose-100 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-coffee/65">
            Hồ sơ <strong>{application.name}</strong> hiện chưa được hiển thị trên UNI-MATE.
          </p>
        </div>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell title="Đăng ký Quán Đối Tác" subtitle="Hoàn tất hồ sơ quán để admin kiểm tra và kích hoạt partner." icon={<Building2 />}>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="space-y-5 rounded-xl border border-coffee/8 bg-white p-5 shadow-soft md:p-7">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tên quán *">
            <Input placeholder="VD: The Coffee House" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Tên chủ quán *">
            <Input placeholder="Họ và tên" value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
          </Field>
        </div>

        <Field label="Địa chỉ cụ thể">
          <Input placeholder="123 Nguyễn Huệ, Quận 1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Thành phố">
            <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, district: districtsFor(e.target.value)[0].label })}>
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </Field>
          <Field label="Quận / Khu vực">
            <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
              {districtChoices.map((c) => <option key={c.label} value={c.label}>{c.district}</option>)}
            </select>
          </Field>
        </div>

        <p className="flex items-center gap-1.5 rounded-lg bg-cream px-3 py-2 text-xs font-semibold text-coffee/60">
          <MapPin className="h-3.5 w-3.5" /> Tọa độ: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
        </p>

        <Field label="Phong cách quán *">
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
        </Field>

        <Field label="Tags">
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button key={tag} type="button" onClick={() => setForm({ ...form, tags: toggleTag(form.tags, tag) })} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${form.tags.includes(tag) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"}`}>
                #{tag}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tiện ích">
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((am) => (
              <button key={am} type="button" onClick={() => setForm({ ...form, amenities: toggleTag(form.amenities, am) })} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${form.amenities.includes(am) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"}`}>
                {am}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Giờ mở cửa">
            <Input placeholder="VD: 7:00 - 22:00" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
          </Field>
          <Field label="Mô tả ngắn">
            <Input placeholder="Đặc điểm nổi bật..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>

        <Button onClick={handleSubmit} disabled={loading} icon={<Send className="h-4 w-4" />} className="w-full">
          {loading ? "Đang gửi..." : "Gửi đăng ký"}
        </Button>
      </div>
    </PartnerShell>
  );
}

function PartnerShell({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-24 md:p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-coffee text-white">
          {icon}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Partner Center</p>
          <h1 className="text-xl font-black text-cocoa">{title}</h1>
          <p className="text-sm text-coffee/60">{subtitle}</p>
        </div>
      </motion.div>
      {children}
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
