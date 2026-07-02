import { Camera, CheckCircle, ChevronRight, Coffee, LocateFixed, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { cities, districtsFor, findLocation, manualLocationPayload } from "../../utils/locationOptions";
import { cafeStyles, goals, interests, preferredTimes, priorities } from "../../utils/options";

const steps = [
  "/onboarding/basic-info",
  "/onboarding/survey-goals",
  "/onboarding/survey-cafe",
  "/onboarding/survey-personality",
  "/onboarding/survey-interests",
  "/onboarding/preferences",
  "/onboarding/location",
  "/onboarding/result"
];

const labels = ["Cơ bản", "Mục tiêu", "Cafe", "Tính cách", "Sở thích", "Gu tìm", "Khu vực", "Xong"];

const initial = {
  displayName: "",
  birthDate: "",
  gender: "prefer_not",
  school: "",
  major: "",
  avatarUrl: "",
  profilePhotos: [] as string[],
  goals: [] as string[],
  preferredTimes: [] as string[],
  cafeStyles: [] as string[],
  budgetRange: "40_70",
  frequency: "weekly",
  personality: { introvertExtrovert: 3, talkListen: 3, newPeopleComfort: 3, studyChillBalance: 3, plannedSpontaneous: 3 },
  interests: [] as string[],
  preferences: { preferredGender: "all", ageRange: { min: 18, max: 28 }, maxDistanceKm: 10, priorities: ["nearby", "same_interest"] as string[] },
  location: { lat: 10.7769, lng: 106.7009, addressLabel: "TP.HCM", source: "manual" }
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function calculateAge(date: string) {
  if (!date) return 0;
  const dob = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function OnboardingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const index = Math.max(0, steps.indexOf(location.pathname === "/onboarding" ? "/onboarding/basic-info" : location.pathname));
  const progress = ((index + 1) / steps.length) * 100;
  const age = useMemo(() => calculateAge(data.birthDate), [data.birthDate]);
  const selectedLocation = findLocation(data.location.addressLabel);
  const districtChoices = districtsFor(selectedLocation.city);

  const chooseManualLocation = (label: string) => {
    const choice = findLocation(label);
    setData({ ...data, location: manualLocationPayload(choice) });
  };

  const next = () => {
    setError("");
    if (index === 0 && (!data.displayName.trim() || !data.birthDate || age < 18)) return setError("Bạn cần nhập tên, ngày sinh hợp lệ và đủ 18 tuổi.");
    if (index === 1 && data.goals.length < 1) return setError("Chọn ít nhất 1 mục tiêu gặp.");
    if (index === 2 && data.cafeStyles.length < 3) return setError("Chọn ít nhất 3 tags cafe để matching chính xác hơn.");
    if (index === 4 && data.interests.length < 3) return setError("Chọn ít nhất 3 sở thích.");
    navigate(steps[Math.min(index + 1, steps.length - 1)]);
  };

  const finish = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.post("/users/onboarding", data);
      updateUser({ ...res.user, id: res.user._id });
      navigate("/app/discovery");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không lưu được onboarding");
    } finally {
      setLoading(false);
    }
  };

  const chipGrid = (items: string[], key: "goals" | "preferredTimes" | "cafeStyles" | "interests") => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Chip key={item} selected={(data[key] as string[]).includes(item)} onClick={() => setData({ ...data, [key]: toggle(data[key] as string[], item) })}>
          {item}
        </Chip>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream px-4 py-6 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-coffee text-white">
              <Coffee />
            </div>
            <div>
              <h1 className="font-black">Tạo hồ sơ</h1>
              <p className="text-sm text-coffee/62">Mất khoảng 2 phút</p>
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-cream">
            <div className="h-full rounded-full bg-caramel transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 grid gap-2">
            {labels.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => i <= index && navigate(steps[i])}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold transition ${
                  i === index ? "bg-latte text-cocoa" : i < index ? "bg-cream text-coffee" : "text-coffee/42"
                }`}
              >
                {label}
                {i < index ? <CheckCircle className="h-4 w-4 text-caramel" /> : null}
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-lg bg-white p-5 shadow-soft md:p-7">
          <AnimatePresence mode="wait">
            <motion.div key={index} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}>
              {index === 0 && (
                <section className="space-y-4">
                  <h2 className="text-2xl font-black">Thông tin cơ bản</h2>
                  <p className="text-sm text-coffee/65">Thông tin này giúp người khác nhận ra bạn là ai trước khi like.</p>
                  <Input placeholder="Tên hiển thị" value={data.displayName} onChange={(e) => setData({ ...data, displayName: e.target.value })} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input type="date" value={data.birthDate} onChange={(e) => setData({ ...data, birthDate: e.target.value })} />
                    <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 outline-none focus:ring-4 focus:ring-caramel/30" value={data.gender} onChange={(e) => setData({ ...data, gender: e.target.value })}>
                      <option value="prefer_not">Không tiết lộ giới tính</option>
                      <option value="female">Nữ</option>
                      <option value="male">Nam</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder="Trường" value={data.school} onChange={(e) => setData({ ...data, school: e.target.value })} />
                    <Input placeholder="Ngành / lĩnh vực" value={data.major} onChange={(e) => setData({ ...data, major: e.target.value })} />
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-coffee/20 bg-cream/60 p-4 font-semibold text-coffee">
                    <Camera className="text-caramel" /> Avatar optional
                    <input type="file" className="hidden" />
                  </label>
                </section>
              )}
              {index === 1 && (
                <section>
                  <h2 className="mb-2 text-2xl font-black">Bạn muốn tìm người đi cafe để làm gì?</h2>
                  <p className="mb-5 text-sm text-coffee/65">Mục tiêu này sẽ xuất hiện trong lý do match.</p>
                  {chipGrid(goals, "goals")}
                </section>
              )}
              {index === 2 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-black">Gu cafe của bạn</h2>
                  <div>
                    <h3 className="mb-2 font-bold">Thời gian rảnh</h3>
                    {chipGrid(preferredTimes, "preferredTimes")}
                  </div>
                  <div>
                    <h3 className="mb-2 font-bold">Style quán, chọn ít nhất 3</h3>
                    {chipGrid(cafeStyles, "cafeStyles")}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="rounded-lg border border-coffee/15 p-3" value={data.budgetRange} onChange={(e) => setData({ ...data, budgetRange: e.target.value })}>
                      <option value="under_40">Dưới 40k</option>
                      <option value="40_70">40-70k</option>
                      <option value="70_120">70-120k</option>
                      <option value="above_120">Trên 120k</option>
                    </select>
                    <select className="rounded-lg border border-coffee/15 p-3" value={data.frequency} onChange={(e) => setData({ ...data, frequency: e.target.value })}>
                      <option value="rarely">Hiếm khi</option>
                      <option value="weekly">Hàng tuần</option>
                      <option value="few_times_week">Vài lần/tuần</option>
                      <option value="daily">Mỗi ngày</option>
                    </select>
                  </div>
                </section>
              )}
              {index === 3 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-black">Nhịp nói chuyện</h2>
                  {Object.entries({ introvertExtrovert: "Hướng nội - Hướng ngoại", talkListen: "Lắng nghe - Nói chuyện", newPeopleComfort: "Cần thời gian - Dễ bắt chuyện", studyChillBalance: "Học nghiêm túc - Chill", plannedSpontaneous: "Kế hoạch - Ngẫu hứng" }).map(([k, label]) => (
                    <label key={k} className="block rounded-lg bg-cream p-4">
                      <div className="mb-2 flex justify-between font-semibold">
                        <span>{label}</span>
                        <span>{(data.personality as any)[k]}</span>
                      </div>
                      <input type="range" min={1} max={5} value={(data.personality as any)[k]} onChange={(e) => setData({ ...data, personality: { ...data.personality, [k]: Number(e.target.value) } })} className="w-full accent-caramel" />
                    </label>
                  ))}
                </section>
              )}
              {index === 4 && (
                <section>
                  <h2 className="mb-2 text-2xl font-black">Sở thích ngoài cafe</h2>
                  <p className="mb-5 text-sm text-coffee/65">Chọn ít nhất 3 để có thêm chủ đề bắt chuyện.</p>
                  {chipGrid(interests, "interests")}
                </section>
              )}
              {index === 5 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-black">Gu tìm kiếm</h2>
                  <select className="w-full rounded-lg border border-coffee/15 p-3" value={data.preferences.preferredGender} onChange={(e) => setData({ ...data, preferences: { ...data.preferences, preferredGender: e.target.value } })}>
                    <option value="all">Tất cả</option>
                    <option value="same">Cùng giới</option>
                    <option value="opposite">Khác giới</option>
                  </select>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input type="number" value={data.preferences.ageRange.min} onChange={(e) => setData({ ...data, preferences: { ...data.preferences, ageRange: { ...data.preferences.ageRange, min: Number(e.target.value) } } })} />
                    <Input type="number" value={data.preferences.ageRange.max} onChange={(e) => setData({ ...data, preferences: { ...data.preferences, ageRange: { ...data.preferences.ageRange, max: Number(e.target.value) } } })} />
                    <Input type="number" min={1} max={20} value={data.preferences.maxDistanceKm} onChange={(e) => setData({ ...data, preferences: { ...data.preferences, maxDistanceKm: Number(e.target.value) } })} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {priorities.map((p) => (
                      <Chip key={p} selected={data.preferences.priorities.includes(p)} onClick={() => setData({ ...data, preferences: { ...data.preferences, priorities: toggle(data.preferences.priorities, p) } })}>
                        {p}
                      </Chip>
                    ))}
                  </div>
                </section>
              )}
              {index === 6 && (
                <section className="space-y-4">
                  <h2 className="text-2xl font-black">Khu vực cafe</h2>
                  <p className="text-coffee/70">Bạn có thể dùng GPS thật hoặc chọn khu vực thủ công. Cả hai cách đều dùng được cho Discovery và Match.</p>
                  <Button icon={<LocateFixed />} onClick={() => navigator.geolocation?.getCurrentPosition((pos) => setData({ ...data, location: { lat: pos.coords.latitude, lng: pos.coords.longitude, addressLabel: "GPS hiện tại", source: "gps" } }), () => setError("Không lấy được GPS, bạn có thể chọn khu vực thủ công bên dưới."))}>
                    Dùng GPS thật
                  </Button>
                  <p className={`rounded-lg p-3 text-sm font-semibold ${data.location.source === "gps" ? "bg-mint text-cocoa" : "bg-latte text-cocoa"}`}>
                    {data.location.source === "gps" ? "Đang dùng GPS thật." : `Đang dùng khu vực: ${data.location.addressLabel}.`}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-coffee">
                      Thành phố
                      <select className="rounded-lg border border-coffee/15 bg-white p-3 outline-none focus:ring-4 focus:ring-caramel/30" value={selectedLocation.city} onChange={(e) => chooseManualLocation(districtsFor(e.target.value)[0].label)}>
                        {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-coffee">
                      Quận / khu vực
                      <select className="rounded-lg border border-coffee/15 bg-white p-3 outline-none focus:ring-4 focus:ring-caramel/30" value={selectedLocation.label} onChange={(e) => chooseManualLocation(e.target.value)}>
                        {districtChoices.map((choice) => <option key={choice.label} value={choice.label}>{choice.district}</option>)}
                      </select>
                    </label>
                  </div>
                </section>
              )}
              {index === 7 && (
                <section className="text-center">
                  <CheckCircle className="mx-auto h-14 w-14 text-caramel" />
                  <h2 className="mt-4 text-2xl font-black">Hồ sơ đã sẵn sàng</h2>
                  <p className="mt-2 text-coffee/70">Gu cafe: {data.cafeStyles.slice(0, 3).join(", ") || "đang cập nhật"}</p>
                  <p className="text-coffee/70">Mục tiêu chính: {data.goals[0] || "kết bạn cafe"}</p>
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cream px-4 py-2 text-sm font-bold text-coffee">
                    <MapPin className="h-4 w-4" /> {data.location.addressLabel}
                  </p>
                </section>
              )}
            </motion.div>
          </AnimatePresence>

          {error ? <p className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-8 flex justify-between gap-3">
            <Button variant="ghost" onClick={() => navigate(steps[Math.max(0, index - 1)])} disabled={index === 0}>
              Quay lại
            </Button>
            {index === steps.length - 1 ? (
              <Button onClick={finish} disabled={loading}>{loading ? "Đang lưu..." : "Bắt đầu khám phá"}</Button>
            ) : (
              <Button onClick={next} icon={<ChevronRight />}>Tiếp tục</Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
