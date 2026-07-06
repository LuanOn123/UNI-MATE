import { Camera, CheckCircle, ChevronRight, Coffee, LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { cities, districtsFor, findLocation, manualLocationPayload } from "../../utils/locationOptions";
import { cafeStyles, goals, interestGroups, majorCategories, majorPreferenceOptions, preferredTimes, priorities, purposeOptions, vibeSpaceOptions } from "../../utils/options";

const steps = [
  "/onboarding/disclaimer",
  "/onboarding/basic-info",
  "/onboarding/survey-purpose",
  "/onboarding/survey-goals",
  "/onboarding/survey-cafe",
  "/onboarding/survey-personality",
  "/onboarding/survey-interests",
  "/onboarding/survey-vibe",
  "/onboarding/preferences",
  "/onboarding/location",
  "/onboarding/result"
];

const labels = ["Điều khoản", "Cơ bản", "Mục đích", "Mục tiêu", "Cafe", "Tính cách", "Sở thích", "Vibe", "Gu tìm", "Khu vực", "Xong"];

const initial = {
  disclaimerAccepted: false,
  displayName: "",
  birthDate: "",
  gender: "prefer_not",
  school: "",
  major: "",
  avatarUrl: "",
  profilePhotos: [] as string[],
  purpose: [] as string[],
  goals: [] as string[],
  preferredTimes: [] as string[],
  cafeStyles: [] as string[],
  budgetRange: "40_70",
  frequency: "weekly",
  majorPreference: "any",
  vibePreference: "",
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
  const index = Math.max(0, steps.indexOf(location.pathname === "/onboarding" ? "/onboarding/disclaimer" : location.pathname));
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
    // Step 0: Disclaimer
    if (index === 0 && !data.disclaimerAccepted) return setError("Bạn cần đồng ý với điều khoản để tiếp tục.");
    // Step 1: Basic info
    if (index === 1 && (!data.displayName.trim() || !data.birthDate || age < 18)) return setError("Bạn cần nhập tên, ngày sinh hợp lệ và đủ 18 tuổi.");
    // Step 2: Purpose (hard filter)
    if (index === 2 && data.purpose.length < 1) return setError("Chọn ít nhất 1 mục đích hôm nay của bạn.");
    // Step 3: Goals
    if (index === 3 && data.goals.length < 1) return setError("Chọn ít nhất 1 mục tiêu gặp.");
    // Step 4: Cafe styles
    if (index === 4 && data.cafeStyles.length < 3) return setError("Chọn ít nhất 3 tags cafe để matching chính xác hơn.");
    // Step 6: Interests
    if (index === 6 && data.interests.length < 3) return setError("Chọn ít nhất 3 sở thích.");
    // Step 7: Vibe
    if (index === 7 && !data.vibePreference) return setError("Chọn vibe không gian bạn mong muốn.");
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
              <p className="text-sm text-coffee/62">Mất khoảng 3 phút</p>
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
              {/* Step 0: Disclaimer */}
              {index === 0 && (
                <section className="space-y-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-caramel" />
                    <h2 className="text-2xl font-black">Điều khoản sử dụng</h2>
                  </div>
                  <div className="rounded-lg border border-coffee/10 bg-cream/60 p-5 text-sm leading-relaxed text-coffee/80">
                    <p className="mb-3 font-semibold text-cocoa">Trước khi bắt đầu, hãy đọc kỹ điều khoản sau:</p>
                    <p>
                      Chúng tôi sử dụng dữ liệu vị trí và sở thích để gợi ý người bạn và địa điểm phù hợp.{" "}
                      <strong>[UNI-MATE]</strong> không chịu trách nhiệm về các tương tác, hành vi cá nhân hoặc sự cố xảy ra ngoài đời thực giữa các người dùng và tại các quán đối tác.
                    </p>
                    <p className="mt-3">
                      Bằng việc đồng ý, bạn xác nhận đã đọc, hiểu và chấp nhận các điều khoản trên. Bạn cũng đồng ý rằng mọi thông tin cá nhân bạn cung cấp sẽ được sử dụng đúng mục đích gợi ý kết nối.
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-coffee/15 bg-white p-4 transition hover:bg-cream/40">
                    <input
                      type="checkbox"
                      checked={data.disclaimerAccepted}
                      onChange={(e) => setData({ ...data, disclaimerAccepted: e.target.checked })}
                      className="h-5 w-5 rounded accent-caramel"
                    />
                    <span className="text-sm font-semibold text-coffee">Tôi đã đọc và đồng ý với điều khoản sử dụng của UNI-MATE</span>
                  </label>
                </section>
              )}

              {/* Step 1: Basic Info */}
              {index === 1 && (
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
                    <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 outline-none focus:ring-4 focus:ring-caramel/30" value={data.major} onChange={(e) => setData({ ...data, major: e.target.value })}>
                      <option value="">Chọn khối ngành</option>
                      {majorCategories.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-coffee/20 bg-cream/60 p-4 font-semibold text-coffee">
                    <Camera className="text-caramel" /> Avatar optional
                    <input type="file" className="hidden" />
                  </label>
                </section>
              )}

              {/* Step 2: Purpose (Hard Filter) */}
              {index === 2 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-black">Hôm nay bạn lên đây để làm gì?</h2>
                  <p className="text-sm text-coffee/65">Chọn một hoặc nhiều mục đích — bạn sẽ được gợi ý người cùng sở thích.</p>
                  <div className="grid gap-3">
                    {purposeOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                          data.purpose.includes(opt.value) ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={opt.value}
                          checked={data.purpose.includes(opt.value)}
                          onChange={() => setData({ ...data, purpose: toggle(data.purpose, opt.value) })}
                          className="accent-caramel"
                        />
                        <span className="font-semibold">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* Step 3: Goals */}
              {index === 3 && (
                <section>
                  <h2 className="mb-2 text-2xl font-black">Bạn muốn tìm người đi cafe để làm gì?</h2>
                  <p className="mb-5 text-sm text-coffee/65">Mục tiêu này sẽ xuất hiện trong lý do match.</p>
                  {chipGrid(goals, "goals")}
                </section>
              )}

              {/* Step 4: Cafe styles */}
              {index === 4 && (
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

              {/* Step 5: Personality */}
              {index === 5 && (
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

              {/* Step 6: Interests (grouped by vibe) */}
              {index === 6 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-black">Sở thích & Vibe của bạn</h2>
                  <p className="text-sm text-coffee/65">Chọn nhanh 3-5 từ khóa mô tả "vibe" của người bạn muốn gặp.</p>

                  {/* Major preference */}
                  <div>
                    <h3 className="mb-3 font-bold">Bạn muốn kết nối với người học ngành nào?</h3>
                    <div className="grid gap-2">
                      {majorPreferenceOptions.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                            data.majorPreference === opt.value ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"
                          }`}
                        >
                          <input
                            type="radio"
                            name="majorPref"
                            value={opt.value}
                            checked={data.majorPreference === opt.value}
                            onChange={() => setData({ ...data, majorPreference: opt.value })}
                            className="accent-caramel"
                          />
                          <span className="font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Interest groups */}
                  {interestGroups.map((group) => (
                    <div key={group.label}>
                      <h3 className="mb-2 font-bold">{group.label}</h3>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((tag) => (
                          <Chip
                            key={tag}
                            selected={data.interests.includes(tag)}
                            onClick={() => setData({ ...data, interests: toggle(data.interests, tag) })}
                          >
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-coffee/50">Đã chọn: {data.interests.length} / tối thiểu 3</p>
                </section>
              )}

              {/* Step 7: Vibe Space Preference */}
              {index === 7 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-black">Nếu được match, gặp nhau ở đâu?</h2>
                  <p className="text-sm text-coffee/65">Hệ thống sẽ gợi ý quán cafe phù hợp dựa trên lựa chọn này.</p>
                  <div className="grid gap-3">
                    {vibeSpaceOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                          data.vibePreference === opt.value ? "border-caramel bg-latte text-cocoa" : "border-coffee/15 bg-white text-coffee hover:bg-cream"
                        }`}
                      >
                        <input
                          type="radio"
                          name="vibePreference"
                          value={opt.value}
                          checked={data.vibePreference === opt.value}
                          onChange={() => setData({ ...data, vibePreference: opt.value })}
                          className="accent-caramel"
                        />
                        <span className="font-semibold text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* Step 8: Preferences */}
              {index === 8 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-black">Gu tìm kiếm</h2>
                  <div>
                    <h3 className="mb-2 font-bold">Bạn muốn tìm kiếm đối tượng nào?</h3>
                    <select className="w-full rounded-lg border border-coffee/15 p-3" value={data.preferences.preferredGender} onChange={(e) => setData({ ...data, preferences: { ...data.preferences, preferredGender: e.target.value } })}>
                      <option value="all">Tất cả</option>
                      <option value="same">Cùng giới</option>
                      <option value="opposite">Khác giới</option>
                    </select>
                  </div>
                  <div>
                    <h3 className="mb-2 font-bold">Bán kính tìm kiếm: {data.preferences.maxDistanceKm}km</h3>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={data.preferences.maxDistanceKm}
                      onChange={(e) => setData({ ...data, preferences: { ...data.preferences, maxDistanceKm: Number(e.target.value) } })}
                      className="w-full accent-caramel"
                    />
                    <div className="flex justify-between text-xs text-coffee/50">
                      <span>1km</span>
                      <span>5km</span>
                      <span>10km</span>
                      <span>20km</span>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input type="number" value={data.preferences.ageRange.min} onChange={(e) => setData({ ...data, preferences: { ...data.preferences, ageRange: { ...data.preferences.ageRange, min: Number(e.target.value) } } })} />
                    <Input type="number" value={data.preferences.ageRange.max} onChange={(e) => setData({ ...data, preferences: { ...data.preferences, ageRange: { ...data.preferences.ageRange, max: Number(e.target.value) } } })} />
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

              {/* Step 9: Location */}
              {index === 9 && (
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

              {/* Step 10: Result */}
              {index === 10 && (
                <section className="text-center">
                  <CheckCircle className="mx-auto h-14 w-14 text-caramel" />
                  <h2 className="mt-4 text-2xl font-black">Hồ sơ đã sẵn sàng</h2>
                  <p className="mt-2 text-coffee/70">Gu cafe: {data.cafeStyles.slice(0, 3).join(", ") || "đang cập nhật"}</p>
                  <p className="text-coffee/70">Mục tiêu chính: {data.goals[0] || "kết bạn cafe"}</p>
                  <p className="text-coffee/70">Mục đích: {data.purpose.length > 0 ? data.purpose.map((p) => purposeOptions.find((o) => o.value === p)?.label).filter(Boolean).join(", ") : "chưa chọn"}</p>
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
