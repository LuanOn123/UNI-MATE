import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Eye,
  Heart,
  Images,
  LogOut,
  MapPin,
  Maximize2,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  UserCircle,
  UsersRound,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { CoffeeMeter } from "../../components/common/CoffeeMeter";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

const fallbackPhoto = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop";

const genderLabel: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
  prefer_not: "Không tiết lộ"
};

const budgetLabels: Record<string, string> = {
  under_40: "Dưới 40k / buổi",
  "40_70": "40k - 70k / buổi",
  "70_120": "70k - 120k / buổi",
  above_120: "Trên 120k / buổi"
};

const frequencyLabels: Record<string, string> = {
  rarely: "Hiếm khi (Thỉnh thoảng)",
  weekly: "Hàng tuần (Cuối tuần rảnh)",
  few_times_week: "Vài lần / tuần",
  daily: "Mỗi ngày (Rất chăm đi)"
};

const personalityConfig = [
  {
    key: "introvertExtrovert",
    title: "Năng lượng giao tiếp",
    left: "Hướng nội",
    right: "Hướng ngoại"
  },
  {
    key: "talkListen",
    title: "Vai trò khi trò chuyện",
    left: "Thích lắng nghe",
    right: "Thích kể chuyện"
  },
  {
    key: "newPeopleComfort",
    title: "Kết nối người mới",
    left: "Cần thời gian\nmở lòng",
    right: "Dễ bắt chuyện\nngay lập tức"
  },
  {
    key: "studyChillBalance",
    title: "Mục đích đến quán",
    left: "Học tập &\nChạy deadline",
    right: "Trò chuyện &\nThư giãn"
  },
  {
    key: "plannedSpontaneous",
    title: "Phong cách lên lịch",
    left: "Lên kế hoạch\ntừ trước",
    right: "Ngẫu hứng\nđi ngay"
  }
];

export function ProfilePage() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"personal" | "card">("personal");
  const [cardPhotoIndex, setCardPhotoIndex] = useState(0);

  useEffect(() => {
    api
      .get("/users/profile")
      .then((res) => updateUser({ ...res.data.user, id: res.data.user._id }))
      .catch(() => undefined);
  }, [updateUser]);

  const tags = user?.onboarding?.cafeStyles ?? [];
  const goals = user?.onboarding?.goals ?? [];
  const interests = user?.onboarding?.interests ?? [];
  const preferredTimes = user?.onboarding?.preferredTimes ?? [];
  const budgetRange = user?.onboarding?.budgetRange;
  const frequency = user?.onboarding?.frequency;
  const personality = user?.onboarding?.personality ?? {};

  const photos = useMemo(
    () => [user?.avatarUrl, ...(user?.profilePhotos ?? [])].filter(Boolean) as string[],
    [user?.avatarUrl, user?.profilePhotos]
  );
  const gallery = photos.length ? photos : [fallbackPhoto];
  const heroPhoto = broken[gallery[0]] ? fallbackPhoto : gallery[0];

  const handleNextPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % gallery.length);
    }
  };

  const handlePrevPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + gallery.length) % gallery.length);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-caramel/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-caramel">
            <Sparkles className="h-3.5 w-3.5" />
            {viewMode === "card" ? "Discovery Preview" : "My Profile"}
          </div>
          <h1 className="mt-2 text-3xl font-black text-coffee md:text-4xl">
            {viewMode === "card" ? "Mô Phỏng Thẻ Khám Phá" : "Hồ Sơ Cá Nhân"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setViewMode(viewMode === "personal" ? "card" : "personal")}
            variant={viewMode === "card" ? "primary" : "ghost"}
            className={
              viewMode === "card"
                ? "rounded-xl bg-caramel hover:bg-caramel/90 text-white font-black shadow-sm"
                : "rounded-xl border border-coffee/15 font-bold shadow-sm"
            }
            icon={<Eye className={viewMode === "card" ? "h-4 w-4 text-white" : "h-4 w-4 text-caramel"} />}
          >
            {viewMode === "card" ? "Quay lại hồ sơ cá nhân" : "Chế độ xem Thẻ Khám Phá"}
          </Button>
          <Link to="/app/settings">
            <Button variant="ghost" className="rounded-xl border border-coffee/15 font-bold shadow-sm" icon={<Settings className="h-4 w-4 text-caramel" />}>
              Chỉnh sửa hồ sơ
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="rounded-xl border border-coffee/15 text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-bold"
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => {
              logout();
              navigate("/auth", { replace: true });
            }}
          >
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main Grid or Discovery Detail Card Preview */}
      {viewMode === "card" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mx-auto max-w-5xl overflow-hidden rounded-[2.2rem] border border-coffee/15 bg-white shadow-soft md:grid md:grid-cols-[440px_minmax(0,1fr)]"
        >
          <div className="relative min-h-[440px] bg-cocoa md:min-h-[760px] h-full flex flex-col">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${gallery[cardPhotoIndex]})` }} />
            <div className="absolute inset-x-0 top-0 flex gap-1.5 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
              {gallery.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCardPhotoIndex(i)}
                  className={`h-1.5 flex-1 cursor-pointer rounded-full transition-all duration-300 ${
                    i === cardPhotoIndex ? "bg-white ring-1 ring-white/50" : "bg-white/35"
                  }`}
                />
              ))}
            </div>
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-cocoa shadow-md hover:bg-white transition"
                  onClick={() => setCardPhotoIndex((value) => (value - 1 + gallery.length) % gallery.length)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-cocoa shadow-md hover:bg-white transition"
                  onClick={() => setCardPhotoIndex((value) => (value + 1) % gallery.length)}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-cocoa/90 via-cocoa/40 to-transparent text-white md:hidden z-10 mt-auto">
              <h2 className="text-3xl font-black">
                {user?.displayName || "UNI-MATE user"}, {user?.age || user?.onboarding?.preferences?.ageRange?.min || user?.onboarding?.age || "20"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-white/80">
                {user?.school || user?.onboarding?.school || "Sinh viên"} {(user?.major || user?.onboarding?.major) ? `· ${user?.major || user?.onboarding?.major}` : ""}
              </p>
            </div>
          </div>

          <div className="p-7 md:p-9 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-caramel/15 px-3 py-1 text-xs font-black text-caramel mb-2.5">
                    <Sparkles className="h-3.5 w-3.5" /> Thẻ Khám Phá Chi Tiết
                  </div>
                  <h2 className="text-3xl font-black text-coffee">
                    {user?.displayName || "UNI-MATE user"}, {user?.age || user?.onboarding?.preferences?.ageRange?.min || user?.onboarding?.age || "20"}
                  </h2>
                  <p className="mt-1.5 text-base font-semibold text-coffee/68">
                    {user?.school || user?.onboarding?.school || "Sinh viên"} {(user?.major || user?.onboarding?.major) ? `· ${user?.major || user?.onboarding?.major}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-cream/90 to-cream/30 border border-caramel/20 p-5 shadow-2xs">
                <div className="shrink-0">
                  <CoffeeMeter value={100} size="lg" />
                </div>
                <div className="min-w-0 text-sm font-semibold text-coffee/75">
                  <p className="text-base font-black text-cocoa">Hồ sơ sẵn sàng kết nối (100%)</p>
                  <p className="mt-1 text-xs sm:text-sm text-coffee/65">Trạng thái: Đang hiển thị nổi bật trên Khám Phá</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-2xl border border-coffee/10 bg-white p-5 text-sm font-medium text-coffee/80 shadow-2xs">
                <p className="flex items-center justify-between">
                  <span className="text-coffee/50">Cung hoàng đạo:</span>
                  <span className="font-bold text-coffee">{user?.zodiac || user?.onboarding?.zodiac || "Đang cập nhật"}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-coffee/50">Giới tính:</span>
                  <span className="font-bold text-coffee">{genderLabel[user?.gender || user?.onboarding?.gender || "prefer_not"] ?? "Chưa tiết lộ"}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-coffee/50">Khu vực:</span>
                  <span className="font-bold text-coffee">{user?.location?.addressLabel || user?.onboarding?.location?.addressLabel || "TP.HCM"}</span>
                </p>
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-coffee/50 mb-3">Gu Quán & Sở Thích</p>
                <div className="flex flex-wrap gap-2">
                  {tags.length ? (
                    tags.map((tag: string) => (
                      <span key={tag} className="rounded-xl bg-latte/60 border border-caramel/20 px-3.5 py-1.5 text-sm font-bold text-cocoa">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-xl bg-latte/60 px-3.5 py-1.5 text-sm font-bold text-cocoa">Cà phê Yên tĩnh</span>
                  )}
                  {goals.map((goal: string) => (
                    <span key={goal} className="rounded-xl bg-cream border border-coffee/10 px-3.5 py-1.5 text-sm font-bold text-coffee">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-coffee/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-coffee/50 mb-3">Điểm Nhấn Hồ Sơ Của Bạn</p>
                <ul className="space-y-2.5 text-sm font-medium text-coffee/80">
                  <li className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-caramel" />
                    <span>{user?.onboarding?.bio || "Một tâm hồn yêu cà phê, thích khám phá và kết nối bạn bè mới"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-caramel" />
                    <span>Phong cách đi quán: {tags.slice(0, 3).join(", ") || "Yên tĩnh, Thư giãn"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-caramel" />
                    <span>Mục tiêu kết nối: {goals.join(", ") || "Học tập, Chạy deadline"}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3.5 pt-4 border-t border-coffee/10">
              <Button
                variant="ghost"
                className="h-12 rounded-xl font-bold border border-coffee/20 text-coffee/70 hover:bg-caramel/10 hover:text-coffee transition shadow-2xs text-sm"
                onClick={() => setViewMode("personal")}
              >
                Quay lại chỉnh sửa
              </Button>
              <Button
                className="h-12 rounded-xl bg-caramel hover:bg-coffee text-white font-black shadow-md text-sm transition"
                onClick={() => setViewMode("personal")}
              >
                Hoàn tất xem thẻ
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Main Grid (Personal Profile View) */
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column: Hero & Details */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Hero Banner Card */}
          <div className="overflow-hidden rounded-3xl border border-coffee/10 bg-white shadow-soft">
            <div className="group relative h-[400px] overflow-hidden bg-coffee/10 sm:h-[480px]">
              <img
                src={heroPhoto}
                alt=""
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                onError={() => setBroken((map) => ({ ...map, [gallery[0]]: true }))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Expand button */}
              <button
                onClick={() => setLightboxIndex(0)}
                className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-xl bg-black/50 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white transition hover:bg-caramel"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Phóng to ảnh
              </button>

              <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                  <div
                    onClick={() => setLightboxIndex(0)}
                    className="grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border-4 border-white bg-latte text-cocoa shadow-lg transition hover:scale-105"
                  >
                    {user?.avatarUrl && !broken[user.avatarUrl] ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={() => setBroken((map) => ({ ...map, [user!.avatarUrl!]: true }))}
                      />
                    ) : (
                      <UserCircle className="h-14 w-14 text-coffee/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                        {user?.displayName ?? "UNI-MATE User"}, {user?.age ?? "18+"}
                      </h2>
                      {user?.onboardingCompleted && (
                        <ShieldCheck className="h-6 w-6 shrink-0 text-caramel fill-white/10" />
                      )}
                    </div>
                    <p className="mt-1.5 text-base font-semibold text-white/85 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4 shrink-0 text-caramel" />
                        {user?.school || "Sinh viên đại học"}
                      </span>
                      {user?.major && <span className="text-white/60">· Khoa {user.major}</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Redesigned 4 Stats Grid: 2 Spacious Columns for uniform height & zero wrapping */}
            <div className="p-6 md:p-8 border-b border-coffee/10 bg-cream/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard icon={<CalendarDays />} label="Cung Hoàng Đạo" value={user?.zodiac || user?.onboarding?.zodiac || "Chưa cập nhật"} />
                <InfoCard icon={<UsersRound />} label="Giới tính" value={genderLabel[user?.gender || user?.onboarding?.gender || "prefer_not"] ?? "Khác"} />
                <InfoCard icon={<MapPin />} label="Khu vực hoạt động" value={user?.location?.addressLabel || user?.onboarding?.location?.addressLabel || "TP. HCM"} />
                <InfoCard
                  icon={<ShieldCheck />}
                  label="Trạng thái hồ sơ"
                  value={user?.onboardingCompleted ? "Hoàn tất 100%" : "Chưa đầy đủ"}
                  highlight
                />
              </div>
            </div>

            {/* Tags & Interests Section */}
            <div className="p-6 md:p-8 space-y-8">
              <Section title="Gu Quán Cà Phê Yêu Thích" icon={<Sparkles />}>
                {tags.length ? tags.map((tag: string) => <Pill key={tag} tone="caramel">{tag}</Pill>) : <Empty />}
              </Section>

              <Section title="Mục Tiêu Kết Nối & Trò Chuyện" icon={<Target />}>
                {goals.length ? goals.map((goal: string) => <Pill key={goal} tone="latte">{goal}</Pill>) : <Empty />}
              </Section>

              <Section title="Sở Thích & Đam Mê" icon={<Heart />}>
                {interests.length ? interests.map((interest: string) => <Pill key={interest} tone="cream">{interest}</Pill>) : <Empty />}
              </Section>
            </div>
          </div>

          {/* Redesigned Card: Cafe & Meetup Habits */}
          <div className="rounded-3xl border border-coffee/10 bg-white p-6 md:p-8 shadow-soft">
            <h3 className="flex items-center gap-2.5 text-xl font-black text-coffee mb-6">
              <Clock className="h-6 w-6 text-caramel" />
              Thói Quen Cà Phê & Gặp Gỡ
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-coffee/10 bg-gradient-to-br from-cream/40 to-cream/10 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-coffee/60">
                  <Coins className="h-4 w-4 text-caramel" />
                  <span>Ngân sách trung bình</span>
                </div>
                <p className="text-lg font-black text-coffee">
                  {budgetRange ? budgetLabels[budgetRange] ?? budgetRange : "Chưa cập nhật"}
                </p>
              </div>

              <div className="rounded-2xl border border-coffee/10 bg-gradient-to-br from-cream/40 to-cream/10 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-coffee/60">
                  <CalendarDays className="h-4 w-4 text-caramel" />
                  <span>Tần suất đi quán cafe</span>
                </div>
                <p className="text-lg font-black text-coffee">
                  {frequency ? frequencyLabels[frequency] ?? frequency : "Chưa cập nhật"}
                </p>
              </div>
            </div>

            {preferredTimes.length > 0 && (
              <div className="mt-6 pt-5 border-t border-coffee/10">
                <p className="text-xs font-bold uppercase tracking-wider text-coffee/60 mb-3">Khung giờ rảnh yêu thích</p>
                <div className="flex flex-wrap gap-2">
                  {preferredTimes.map((time: string) => (
                    <span
                      key={time}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-caramel/25 bg-latte/40 px-3.5 py-1.5 text-sm font-bold text-cocoa"
                    >
                      <Clock className="h-3.5 w-3.5 text-caramel" />
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Redesigned Card: Personality Spectrum (Sleek, Compact, Modern 2-Column Grid) */}
          <div className="rounded-3xl border border-coffee/10 bg-white p-6 md:p-8 shadow-soft">
            <div className="mb-6">
              <h3 className="flex items-center gap-2.5 text-xl font-black text-coffee mb-1">
                <Sliders className="h-6 w-6 text-caramel" />
                Bản Đồ Tính Cách (Personality Spectrum)
              </h3>
              <p className="text-xs font-semibold text-coffee/60">
                Sự hòa hợp về tính cách giúp các buổi gặp gỡ và trò chuyện tại quán tự nhiên hơn
              </p>
            </div>

            {/* Compact 2-column Trait Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {personalityConfig.map((item) => {
                const val = (personality as any)[item.key] ?? 3;
                const leansLeft = val <= 2;
                const leansRight = val >= 4;
                const isBalanced = val === 3;

                return (
                  <div
                    key={item.key}
                    className="flex flex-col justify-between rounded-2xl border border-coffee/10 bg-gradient-to-br from-white via-cream/20 to-cream/40 p-4 transition hover:shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-sm font-black text-coffee">{item.title}</span>
                      <span className="rounded-md bg-caramel/15 px-2 py-0.5 text-[11px] font-black text-caramel shrink-0">
                        {val} / 5
                      </span>
                    </div>

                    {/* Visual 5-Dot Indicator Track */}
                    <div className="grid grid-cols-5 gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map((step) => {
                        const active = step === val;
                        return (
                          <div
                            key={step}
                            className={`h-2.5 rounded-full transition-all duration-300 ${active
                                ? "bg-caramel ring-2 ring-caramel/30 scale-105 shadow-sm"
                                : step < val
                                  ? "bg-caramel/30"
                                  : "bg-coffee/10"
                              }`}
                          />
                        );
                      })}
                    </div>

                    {/* Dual Labels (Highlighted based on active side, NO truncation, Semantic line breaks) */}
                    <div className="mt-3 flex items-start justify-between text-xs font-bold gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 leading-snug transition whitespace-pre-line text-left max-w-[48%] ${leansLeft
                            ? "bg-caramel text-white font-black shadow-xs"
                            : isBalanced
                              ? "text-coffee/80 bg-coffee/5"
                              : "text-coffee/40"
                          }`}
                      >
                        {item.left}
                      </span>
                      <span
                        className={`rounded-lg px-2.5 py-1 leading-snug transition whitespace-pre-line text-right max-w-[48%] ${leansRight
                            ? "bg-caramel text-white font-black shadow-xs"
                            : isBalanced
                              ? "text-coffee/80 bg-coffee/5"
                              : "text-coffee/40"
                          }`}
                      >
                        {item.right}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Right Sidebar: Photo Gallery & Preferences */}
        <aside className="space-y-6">
          {/* Photo Gallery Card */}
          <div className="rounded-3xl border border-coffee/10 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-black text-coffee">
                <Images className="h-5 w-5 text-caramel" />
                Bộ Sưu Tập ({gallery.length})
              </h3>
              <span className="text-xs font-bold text-coffee/50">Bấm xem lớn</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {gallery.map((photo, i) => {
                const src = broken[photo] ? fallbackPhoto : photo;
                return (
                  <div
                    key={`${photo}-${i}`}
                    onClick={() => setLightboxIndex(i)}
                    className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl bg-coffee/10 shadow-sm transition hover:scale-[1.02]"
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={() => setBroken((map) => ({ ...map, [photo]: true }))}
                    />
                    <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Maximize2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/app/settings" className="mt-5 block">
              <Button className="w-full rounded-xl h-11 font-bold shadow-sm" variant="ghost">
                Thêm / Chỉnh sửa ảnh
              </Button>
            </Link>
          </div>

          {/* Matching Preferences Card */}
          <div className="rounded-3xl border border-coffee/10 bg-white p-6 shadow-soft">
            <h3 className="flex items-center gap-2 text-lg font-black text-coffee mb-4">
              <Target className="h-5 w-5 text-caramel" />
              Tiêu Chí Match Mong Muốn
            </h3>

            <div className="space-y-3.5 text-sm font-medium text-coffee/80">
              <div className="flex items-center justify-between rounded-xl bg-cream/60 p-3.5">
                <span className="text-coffee/60">Đối tượng tìm kiếm:</span>
                <span className="font-black text-coffee">
                  {user?.onboarding?.preferences?.preferredGender === "same"
                    ? "Cùng giới"
                    : user?.onboarding?.preferences?.preferredGender === "opposite"
                      ? "Khác giới"
                      : "Tất cả mọi người"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-cream/60 p-3.5">
                <span className="text-coffee/60">Độ tuổi phù hợp:</span>
                <span className="font-black text-coffee">
                  {user?.onboarding?.preferences?.ageRange?.min ?? 18} - {user?.onboarding?.preferences?.ageRange?.max ?? 28} tuổi
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-cream/60 p-3.5">
                <span className="text-coffee/60">Khoảng cách tối đa:</span>
                <span className="font-black text-caramel">
                  Bán kính {user?.onboarding?.preferences?.maxDistanceKm ?? 10} km
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Prev button */}
            {gallery.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto();
                }}
                className="absolute left-4 sm:left-8 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-caramel"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            {/* Next button */}
            {gallery.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                className="absolute right-4 sm:right-8 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-caramel"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}

            {/* Main Image */}
            <div
              className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-3xl bg-black/40 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={broken[gallery[lightboxIndex]] ? fallbackPhoto : gallery[lightboxIndex]}
                alt=""
                className="max-h-[85vh] max-w-[90vw] object-contain"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white">
                Ảnh {lightboxIndex + 1} / {gallery.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Redesigned InfoCard: Clean horizontal layout, uniform height and alignment across all 4 cards, no jumping labels */
function InfoCard({
  icon,
  label,
  value,
  highlight = false
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-2xl border p-4 shadow-xs transition ${highlight
          ? "border-caramel/30 bg-white shadow-sm"
          : "border-coffee/10 bg-white/90"
        }`}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-latte/70 text-caramel shadow-xs">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-coffee/50 line-clamp-1">{label}</p>
        <p className="font-black text-coffee text-sm sm:text-base leading-snug break-words">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3.5 flex items-center gap-2 text-lg font-black text-coffee">
        {icon ? <span className="text-caramel">{icon}</span> : null}
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({
  children,
  tone = "cream"
}: {
  children: ReactNode;
  tone?: "cream" | "latte" | "caramel";
}) {
  const styles =
    tone === "caramel"
      ? "bg-caramel text-white shadow-sm"
      : tone === "latte"
        ? "bg-latte text-cocoa border border-caramel/20"
        : "bg-cream text-coffee border border-coffee/10";
  return <span className={`rounded-xl px-3.5 py-1.5 text-sm font-bold ${styles}`}>{children}</span>;
}

function Empty() {
  return <span className="text-sm font-medium italic text-coffee/50">Chưa cập nhật thông tin</span>;
}
