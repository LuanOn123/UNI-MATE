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
  { value: "quiet_study", label: "Học tập & làm việc", desc: "Yên tĩnh, có ổ cắm, wifi mạnh, hợp ngồi lâu." },
  { value: "acoustic_view", label: "Trò chuyện & chill", desc: "Không gian đẹp, nhạc nhẹ, hợp hẹn gặp và chụp ảnh." },
  { value: "boardgame_lively", label: "Nhóm bạn & boardgame", desc: "Sôi động, có trò chơi, hợp đi nhóm và phá băng." }
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

function minutesOf(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function parseLatLng(value?: string) {
  const match = value?.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function nearestLocationByCoords(lat: number, lng: number) {
  return locationChoices.reduce((nearest, choice) => {
    const currentDistance = (choice.lat - lat) ** 2 + (choice.lng - lng) ** 2;
    const nearestDistance = (nearest.lat - lat) ** 2 + (nearest.lng - lng) ** 2;
    return currentDistance < nearestDistance ? choice : nearest;
  }, locationChoices[0]);
}

type PartnerPlace = {
  _id: string;
  name: string;
  address?: string;
  streetAddress?: string;
  ward?: string;
  addressNote?: string;
  mapPinNote?: string;
  district?: string;
  city?: string;
  status: "pending" | "active" | "hidden" | "rejected";
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
    streetAddress: "",
    ward: "",
    addressNote: "",
    mapPinNote: "",
    description: "",
    cafeVibe: "",
    city: "TP.HCM",
    district: locationChoices[0].label,
    priceLevel: "$$",
    tags: [] as string[],
    amenities: [] as string[],
    openingStart: "07:00",
    openingEnd: "22:00",
    partnerName: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [application, setApplication] = useState<PartnerPlace | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resolvedPin, setResolvedPin] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [resolvingPin, setResolvingPin] = useState(false);

  const selectedLocation = findLocation(form.district);
  const districtChoices = districtsFor(form.city);
  const fullAddress = [
    form.streetAddress.trim() || form.address.trim(),
    form.ward.trim(),
    selectedLocation.district,
    form.city
  ].filter(Boolean).join(", ");
  const parsedPin = parseLatLng(form.mapPinNote);
  const hasPinnedLocation = Boolean(parsedPin || resolvedPin);
  const pinLat = parsedPin?.lat ?? resolvedPin?.lat ?? selectedLocation.lat;
  const pinLng = parsedPin?.lng ?? resolvedPin?.lng ?? selectedLocation.lng;
  const pinSearchText = form.mapPinNote.trim();
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${pinLng - 0.012}%2C${pinLat - 0.009}%2C${pinLng + 0.012}%2C${pinLat + 0.009}&layer=mapnik&marker=${pinLat}%2C${pinLng}`;

  const toggleValue = (list: string[], value: string, max?: number) => {
    if (list.includes(value)) return list.filter((x) => x !== value);
    if (max && list.length >= max) return list;
    return [...list, value];
  };

  useEffect(() => {
    let alive = true;
    api.get("/places/my-partner-registration")
      .then((res) => alive && setApplication(res.data.place ?? null))
      .catch(() => undefined)
      .finally(() => alive && setChecking(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const query = form.mapPinNote.trim();
    if (!query || parseLatLng(query)) {
      setResolvedPin(null);
      setResolvingPin(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResolvingPin(true);
      try {
        const search = [query, form.ward, selectedLocation.district, form.city].filter(Boolean).join(", ");
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(search)}`, {
          signal: controller.signal
        });
        const [first] = await res.json();
        if (!first) {
          setResolvedPin(null);
          return;
        }
        setResolvedPin({ lat: Number(first.lat), lng: Number(first.lon), label: first.display_name });
      } catch {
        if (!controller.signal.aborted) setResolvedPin(null);
      } finally {
        if (!controller.signal.aborted) setResolvingPin(false);
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.mapPinNote, form.ward, form.city, selectedLocation.district]);

  useEffect(() => {
    if (!hasPinnedLocation) return;
    const nearest = nearestLocationByCoords(pinLat, pinLng);
    setForm((current) => {
      if (current.city === nearest.city && current.district === nearest.label) return current;
      return { ...current, city: nearest.city, district: nearest.label };
    });
  }, [hasPinnedLocation, pinLat, pinLng]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Tên quán là bắt buộc.");
    if (!form.cafeVibe) return setError("Vui lòng chọn phong cách quán.");
    if (!form.partnerName.trim()) return setError("Tên chủ quán là bắt buộc.");
    if (!form.streetAddress.trim() && !form.address.trim()) return setError("Vui lòng nhập số nhà, tên đường của quán.");
    if (!form.ward.trim()) return setError("Vui lòng nhập phường/xã của quán.");
    if (form.description.trim().length > 180) return setError("Mô tả ngắn tối đa 180 ký tự.");
    if (minutesOf(form.openingStart) >= minutesOf(form.openingEnd)) return setError("Giờ đóng cửa phải sau giờ mở cửa.");

    setLoading(true);
    setError("");
    const openingHours = `${form.openingStart} - ${form.openingEnd}`;
    try {
      const { data } = await api.post("/places/partner-register", {
        name: form.name,
        address: fullAddress,
        streetAddress: form.streetAddress || form.address,
        ward: form.ward,
        addressNote: form.addressNote,
        mapPinNote: form.mapPinNote,
        description: form.description,
        cafeVibe: form.cafeVibe,
        priceLevel: form.priceLevel,
        tags: form.tags,
        amenities: form.amenities,
        openingHours,
        partnerName: form.partnerName,
        city: form.city,
        district: selectedLocation.district,
        lat: pinLat,
        lng: pinLng
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
      <PartnerShell title="Hồ sơ quán đang chờ duyệt" subtitle="Bạn đang ở khu vực đối tác, không phải giao diện match của người dùng." icon={<Clock />}>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-xl border border-amber-100 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <Clock />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-600">Đang chờ duyệt</p>
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

  if (application?.status === "hidden" || application?.status === "rejected") {
    return (
      <PartnerShell title="Hồ sơ quán chưa được duyệt" subtitle="Bạn có thể kiểm tra lại thông tin và liên hệ admin để được hỗ trợ." icon={<XCircle />}>
        <div className="rounded-xl border border-rose-100 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-coffee/65">
            Hồ sơ <strong>{application.name}</strong> hiện chưa được hiển thị trên UNI-MATE. Bạn có thể chỉnh sửa lại thông tin hoặc gửi đăng ký mới.
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

        <section className="rounded-xl border border-coffee/10 bg-cream/45 p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-caramel">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-cocoa">Địa chỉ kinh doanh</h2>
              <p className="text-xs font-semibold leading-relaxed text-coffee/55">Thông tin này giúp admin duyệt quán và giúp user tìm đúng cửa vào.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Số nhà, tên đường *">
              <Input placeholder="VD: 123 Nguyễn Huệ" value={form.streetAddress} onChange={(e) => setForm({ ...form, streetAddress: e.target.value, address: e.target.value })} />
            </Field>
            <Field label="Phường / Xã *">
              <Input placeholder="VD: Phường Bến Nghé" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
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

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <Field label="Ghi chú địa chỉ">
                <Input placeholder="VD: Tầng trệt, gần cổng trường, hẻm 5m..." value={form.addressNote} onChange={(e) => setForm({ ...form, addressNote: e.target.value })} />
              </Field>
              <Field label="Tọa độ hoặc tên vị trí ghim map">
                <Input placeholder="VD: 10.7757, 106.7004 hoặc Hala Coffee Quận 1" value={form.mapPinNote} onChange={(e) => setForm({ ...form, mapPinNote: e.target.value })} />
              </Field>
              <div className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-coffee/65">
                <p className="font-black text-cocoa">Địa chỉ sẽ hiển thị</p>
                <p className="mt-1">{fullAddress || "Chưa có địa chỉ đầy đủ"}</p>
                <p className="mt-2 flex items-center gap-1.5 text-coffee/50">
                  <MapPin className="h-3.5 w-3.5" /> Tọa độ ghim: {pinLat.toFixed(4)}, {pinLng.toFixed(4)}
                </p>
                {hasPinnedLocation ? <p className="mt-1 text-coffee/45">Khu vực tự cập nhật: {selectedLocation.district}, {form.city}</p> : null}
                {!parsedPin && pinSearchText ? (
                  <p className="mt-1 text-coffee/45">
                    {resolvingPin
                      ? "Đang tìm vị trí trên bản đồ..."
                      : resolvedPin
                      ? `Đã tìm thấy: ${resolvedPin.label?.split(",").slice(0, 2).join(", ")}`
                      : "Chưa tìm được tọa độ, map đang ghim theo khu vực đã chọn."}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-coffee/10 bg-white">
              <iframe title="Bản đồ vị trí quán" src={mapSrc} className="h-56 w-full border-0" loading="lazy" />
              <div className="border-t border-coffee/10 p-3 text-xs font-semibold text-coffee/55">
                Nhập tọa độ để ghim chính xác. Thành phố và quận/khu vực sẽ tự đổi theo vị trí gần nhất.
              </div>
            </div>
          </div>
        </section>

        <Field label="Quán phù hợp nhất cho *">
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

        <Field label={`Đặc trưng nổi bật (${form.tags.length}/${maxTags})`}>
          <p className="mb-2 text-xs font-semibold text-coffee/55">Chọn 3-5 điểm giúp user biết quán hợp với kiểu gặp nào.</p>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button key={tag.value} type="button" onClick={() => setForm({ ...form, tags: toggleValue(form.tags, tag.value, maxTags) })} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${form.tags.includes(tag.value) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"}`}>
                {tag.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tiện ích có tại quán">
          <p className="mb-2 text-xs font-semibold text-coffee/55">Chỉ chọn cơ sở vật chất thật sự có, phần này sẽ hiện trên trang chi tiết quán.</p>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((am) => (
              <button key={am.value} type="button" onClick={() => setForm({ ...form, amenities: toggleValue(form.amenities, am.value) })} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${form.amenities.includes(am.value) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"}`}>
                {am.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Giờ mở cửa *">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.openingStart} onChange={(e) => setForm({ ...form, openingStart: e.target.value })}>
                {timeOptions.slice(0, -1).map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
              <span className="text-sm font-black text-coffee/45">đến</span>
              <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.openingEnd} onChange={(e) => setForm({ ...form, openingEnd: e.target.value })}>
                {timeOptions.slice(1).map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
            <p className="mt-1 text-xs font-semibold text-coffee/55">Đang chọn: {form.openingStart} - {form.openingEnd}</p>
          </Field>
          <Field label="Mức giá trung bình">
            <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30" value={form.priceLevel} onChange={(e) => setForm({ ...form, priceLevel: e.target.value })}>
              {priceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label={`Mô tả ngắn (${form.description.length}/180)`}>
            <textarea
              className="min-h-[86px] w-full rounded-lg border border-coffee/15 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-caramel/30"
              maxLength={180}
              placeholder="VD: Quán yên tĩnh buổi chiều, bàn rộng, hợp học nhóm 2-4 người."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-caramel">Khu vực đối tác</p>
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
