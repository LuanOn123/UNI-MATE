import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Compass,
  Heart,
  Info,
  MapPin,
  Save,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserCircle
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import type { User } from "../../types";
import { cities, districtsFor, findLocation, manualLocationPayload } from "../../utils/locationOptions";
import { cafeStyles, goals, interests, majorCategories, preferredTimes, priorities, priorityLabels } from "../../utils/options";

type PhotoDraft = { id: string; url?: string; file?: File; preview: string };

function displayUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

function toDateInput(value?: string | Date) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function buildForm(user?: User | null) {
  const onboarding = user?.onboarding ?? {};
  const coords = user?.location?.coordinates ?? [106.7009, 10.7769];
  return {
    disclaimerAccepted: true,
    displayName: user?.displayName ?? "",
    birthDate: toDateInput(user?.birthDate),
    gender: user?.gender ?? "prefer_not",
    school: user?.school ?? "",
    major: user?.major ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    purpose: onboarding.purpose && onboarding.purpose.length ? onboarding.purpose : ["study_buddy", "cafe_chat"],
    vibePreference: onboarding.vibePreference ?? "quiet_study",
    majorPreference: onboarding.majorPreference ?? "any",
    goals: onboarding.goals ?? [],
    preferredTimes: onboarding.preferredTimes ?? [],
    cafeStyles: onboarding.cafeStyles ?? [],
    budgetRange: onboarding.budgetRange ?? "40_70",
    frequency: onboarding.frequency ?? "weekly",
    personality: {
      introvertExtrovert: onboarding.personality?.introvertExtrovert ?? 3,
      talkListen: onboarding.personality?.talkListen ?? 3,
      newPeopleComfort: onboarding.personality?.newPeopleComfort ?? 3,
      studyChillBalance: onboarding.personality?.studyChillBalance ?? 3,
      plannedSpontaneous: onboarding.personality?.plannedSpontaneous ?? 3
    },
    interests: onboarding.interests ?? [],
    preferences: (() => {
      const prefs = onboarding.preferences ?? user?.preferences ?? {};
      return {
        preferredGender: prefs.preferredGender ?? "all",
        ageRange: {
          min: prefs.ageRange?.min ?? 18,
          max: prefs.ageRange?.max ?? 28
        },
        maxDistanceKm: prefs.maxDistanceKm ?? 10,
        priorities: prefs.priorities ?? ["nearby", "same_interest"]
      };
    })(),
    location: {
      lat: coords[1] ?? 10.7769,
      lng: coords[0] ?? 106.7009,
      addressLabel: user?.location?.addressLabel ?? "TP.HCM",
      source: user?.location?.source ?? "manual"
    }
  };
}

function photoDrafts(user?: User | null): PhotoDraft[] {
  return (user?.profilePhotos ?? []).map((url, index) => ({ id: `${index}-${url}`, url, preview: displayUrl(url) }));
}

async function uploadPhoto(file: File, field: "avatar" | "photo") {
  const fd = new FormData();
  fd.append(field, file);
  const endpoint = field === "avatar" ? "/users/avatar" : "/users/photo";
  const { data } = await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data.url as string;
}

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

export function SettingsPage() {
  const storedUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const navigate = useNavigate();
  const [form, setForm] = useState(() => buildForm(storedUser));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(storedUser?.avatarUrl ?? "");
  const [photos, setPhotos] = useState<PhotoDraft[]>(() => photoDrafts(storedUser));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/users/profile")
      .then((res) => {
        const fresh = { ...res.data.user, id: res.data.user._id } as User;
        updateUser(fresh);
        setForm(buildForm(fresh));
        setAvatarPreview(displayUrl(fresh.avatarUrl));
        setPhotos(photoDrafts(fresh));
      })
      .catch(() => undefined);
  }, [updateUser]);

  const previewPhotos = useMemo(
    () => [avatarPreview, ...photos.map((photo) => photo.preview)].filter(Boolean),
    [avatarPreview, photos]
  );
  const selectedLocation = findLocation(form.location.addressLabel);
  const districtChoices = districtsFor(selectedLocation.city);

  const chooseManualLocation = (label: string) => {
    const choice = findLocation(label);
    setForm({ ...form, location: manualLocationPayload(choice) });
  };

  const save = async () => {
    setError("");
    setSaved("");
    if (!form.displayName.trim() || !form.birthDate) {
      return setError("Tên hiển thị và ngày sinh là bắt buộc.");
    }
    if (form.cafeStyles.length < 3) {
      return setError(`Gu style quán cần chọn ít nhất 3 tags (hiện tại ${form.cafeStyles.length}/3).`);
    }
    if (form.goals.length < 1) {
      return setError("Mục tiêu gặp cần chọn ít nhất 1 mục tiêu.");
    }
    if (form.interests.length < 3) {
      return setError(`Sở thích cần chọn ít nhất 3 tags (hiện tại ${form.interests.length}/3).`);
    }

    setSaving(true);
    try {
      const avatarUrl = avatarFile ? await uploadPhoto(avatarFile, "avatar") : form.avatarUrl;
      const profilePhotos = await Promise.all(
        photos.map((photo) => (photo.file ? uploadPhoto(photo.file, "photo") : Promise.resolve(photo.url ?? "")))
      );
      const payload = { ...form, avatarUrl, profilePhotos: profilePhotos.filter(Boolean) };
      await api.patch("/users/profile", payload);
      const { data } = await api.get("/users/profile");
      const fresh = { ...data.user, id: data.user._id } as User;
      updateUser(fresh);
      setForm(buildForm(fresh));
      setAvatarFile(null);
      setAvatarPreview(displayUrl(fresh.avatarUrl));
      setPhotos(photoDrafts(fresh));
      setSaved("Đã cập nhật hồ sơ thành công!");
      setTimeout(() => setSaved(""), 4000);
    } catch (e: any) {
      const issues = e.response?.data?.validationIssues;
      const labels: Record<string, string> = {
        disclaimerAccepted: "Điều khoản",
        displayName: "Tên hiển thị",
        birthDate: "Ngày sinh",
        gender: "Giới tính",
        purpose: "Mục đích",
        goals: "Mục tiêu",
        cafeStyles: "Gu cafe",
        vibePreference: "Vibe gặp mặt",
        interests: "Sở thích",
        preferences: "Gu tìm",
        location: "Khu vực",
        school: "Trường",
        major: "Ngành học"
      };
      if (Array.isArray(issues) && issues.length > 0) {
        const details = issues.map((iss) => {
          const field = String(iss.path ?? "").split(".")[0];
          const label = labels[field] ?? field;
          return `${label}: ${iss.message}`;
        }).join(" • ");
        setError(details);
      } else {
        setError(e.response?.data?.message ?? "Không lưu được hồ sơ");
      }
    } finally {
      setSaving(false);
    }
  };

  const chipGrid = (
    items: string[],
    key: "goals" | "preferredTimes" | "cafeStyles" | "interests"
  ) => (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item) => {
        const selected = (form[key] as string[]).includes(item);
        return (
          <Chip
            key={item}
            selected={selected}
            onClick={() => setForm({ ...form, [key]: toggle(form[key] as string[], item) })}
          >
            {item}
          </Chip>
        );
      })}
    </div>
  );

  const pickAvatar = (file?: File) => {
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const addPhoto = (file?: File) => {
    if (!file) return;
    setPhotos((list) => [...list, { id: `${Date.now()}-${file.name}`, file, preview: URL.createObjectURL(file) }]);
  };

  const useGps = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        setForm({
          ...form,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude, addressLabel: "GPS hiện tại", source: "gps" }
        }),
      () => setError("Không lấy được GPS. Vui lòng cấp quyền vị trí cho trình duyệt.")
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8 pb-32">
      <div className="mb-6">
        <Link
          to="/app/profile"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-coffee/70 transition hover:text-caramel"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Hồ sơ
        </Link>
        <h1 className="mt-2 text-3xl font-black text-coffee md:text-4xl">Chỉnh Sửa Hồ Sơ</h1>
      </div>

      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700 shadow-sm">
          <Info className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {saved ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{saved}</span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main Column */}
        <main className="space-y-6">
          <Panel title="Thông tin cơ bản" icon={<UserCircle />}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                  Tên hiển thị <span className="text-rose-500">*</span>
                </label>
                <Input
                  className="rounded-xl h-11"
                  placeholder="Tên hiển thị của bạn"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                  Ngày sinh <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  className="rounded-xl h-11"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">Giới tính</label>
                <select
                  className="w-full h-11 rounded-xl border border-coffee/15 bg-white px-3.5 font-semibold text-coffee outline-none focus:border-caramel focus:ring-4 focus:ring-caramel/20 transition"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="prefer_not">Không tiết lộ giới tính</option>
                  <option value="female">Nữ</option>
                  <option value="male">Nam</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                  Trường / Đơn vị
                </label>
                <Input
                  className="rounded-xl h-11"
                  placeholder="Trường đại học..."
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                  Ngành học / Lĩnh vực quan tâm
                </label>
                <select
                  className="w-full h-11 rounded-xl border border-coffee/15 bg-white px-3.5 font-semibold text-coffee outline-none focus:border-caramel focus:ring-4 focus:ring-caramel/20 transition"
                  value={form.major}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                >
                  <option value="">Chọn khối ngành</option>
                  {majorCategories.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Panel>

          <Panel
            title="Mục tiêu kết nối"
            icon={<Target />}
            badge={
              form.goals.length >= 1 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Đã chọn {form.goals.length}/1
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
                  ⚠️ Chọn ít nhất 1
                </span>
              )
            }
          >
            <p className="text-xs font-semibold text-coffee/60 mb-3.5">
              Chọn mục đích chính mà bạn muốn tìm kiếm người đồng hành tại UNI-MATE
            </p>
            {chipGrid(goals, "goals")}
          </Panel>

          <Panel
            title="Gu quán Cà phê & Thói quen"
            icon={<Sparkles />}
            badge={
              form.cafeStyles.length >= 3 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Đã chọn {form.cafeStyles.length}/3
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
                  ⚠️ Chọn thêm {3 - form.cafeStyles.length} style
                </span>
              )
            }
          >
            <div className="space-y-6">
              <div>
                <h3 className="mb-1.5 text-sm font-black text-coffee">Style không gian quán yêu thích</h3>
                <p className="text-xs font-semibold text-coffee/60 mb-3">Chọn ít nhất 3 phong cách quán bạn thích ngồi nhất</p>
                {chipGrid(cafeStyles, "cafeStyles")}
              </div>

              <div className="pt-4 border-t border-coffee/10">
                <h3 className="mb-1.5 text-sm font-black text-coffee">Khung giờ rảnh trong ngày</h3>
                <p className="text-xs font-semibold text-coffee/60 mb-3">Thời gian bạn thường thuận tiện đi cà phê hoặc học bài</p>
                {chipGrid(preferredTimes, "preferredTimes")}
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-coffee/10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                    Ngân sách trung bình / buổi
                  </label>
                  <select
                    className="w-full h-11 rounded-xl border border-coffee/15 bg-white px-3.5 font-semibold text-coffee outline-none focus:border-caramel focus:ring-4 focus:ring-caramel/20 transition"
                    value={form.budgetRange}
                    onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                  >
                    <option value="under_40">Dưới 40k / buổi</option>
                    <option value="40_70">40k - 70k / buổi</option>
                    <option value="70_120">70k - 120k / buổi</option>
                    <option value="above_120">Trên 120k / buổi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                    Tần suất đi quán cafe
                  </label>
                  <select
                    className="w-full h-11 rounded-xl border border-coffee/15 bg-white px-3.5 font-semibold text-coffee outline-none focus:border-caramel focus:ring-4 focus:ring-caramel/20 transition"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  >
                    <option value="rarely">Hiếm khi (Thỉnh thoảng)</option>
                    <option value="weekly">Hàng tuần (Cuối tuần rảnh)</option>
                    <option value="few_times_week">Vài lần / tuần</option>
                    <option value="daily">Mỗi ngày (Rất hay ngồi quán)</option>
                  </select>
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Sở thích & Đam mê cá nhân"
            icon={<Heart />}
            badge={
              form.interests.length >= 3 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Đã chọn {form.interests.length}/3
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
                  ⚠️ Chọn thêm {3 - form.interests.length} sở thích
                </span>
              )
            }
          >
            <p className="text-xs font-semibold text-coffee/60 mb-3.5">
              Chọn ít nhất 3 chủ đề mà bạn có thể nói chuyện không biết chán
            </p>
            {chipGrid(interests, "interests")}
          </Panel>

          {/* Sleek, Compact 2-Column Personality Sliders */}
          <Panel title="Chỉ số tính cách (Personality Sliders)" icon={<Sliders />}>
            <p className="text-xs font-semibold text-coffee/60 mb-5">
              Kéo thanh trượt từ 1 đến 5 để phản ánh mức độ phù hợp nhất với con người bạn
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {personalityConfig.map((item) => {
                const val = (form.personality as any)[item.key] ?? 3;
                const leansLeft = val <= 2;
                const leansRight = val >= 4;
                const isBalanced = val === 3;

                return (
                  <div
                    key={item.key}
                    className="flex flex-col justify-between rounded-2xl border border-coffee/10 bg-gradient-to-br from-white to-cream/30 p-4 transition hover:shadow-xs"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-coffee">{item.title}</span>
                      <span className="rounded-md bg-caramel/15 px-2 py-0.5 text-[11px] font-black text-caramel shrink-0">
                        {val} / 5
                      </span>
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={val}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          personality: { ...form.personality, [item.key]: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-caramel h-2 rounded-lg cursor-pointer bg-coffee/15 my-2"
                    />

                    <div className="mt-2 flex items-start justify-between text-xs font-bold gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 leading-snug transition whitespace-pre-line text-left max-w-[48%] ${leansLeft
                            ? "bg-caramel text-white font-black"
                            : isBalanced
                              ? "text-coffee/80 bg-coffee/5"
                              : "text-coffee/40"
                          }`}
                      >
                        {item.left}
                      </span>
                      <span
                        className={`rounded-lg px-2.5 py-1 leading-snug transition whitespace-pre-line text-right max-w-[48%] ${leansRight
                            ? "bg-caramel text-white font-black"
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
          </Panel>
        </main>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          <Panel title="Quản lý Ảnh hồ sơ" icon={<Camera />}>
            <div className="space-y-3.5">
              <label className="flex items-center justify-center gap-2.5 cursor-pointer rounded-2xl border-2 border-dashed border-caramel/40 bg-cream/70 p-4 text-center font-bold text-coffee transition hover:bg-cream hover:border-caramel">
                <Upload className="h-5 w-5 text-caramel shrink-0" />
                <span>Thay ảnh chính (Avatar)</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
              </label>

              <label className="flex items-center justify-center gap-2.5 cursor-pointer rounded-2xl border border-coffee/15 bg-white p-4 text-center font-bold text-coffee shadow-sm transition hover:bg-cream/40 hover:border-caramel/30">
                <Camera className="h-5 w-5 text-caramel shrink-0" />
                <span>Thêm ảnh phụ vào Album</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto(e.target.files?.[0])} />
              </label>

              {/* Photos list */}
              {photos.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-coffee/50">Danh sách ảnh phụ ({photos.length})</p>
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="flex items-center gap-3 rounded-xl border border-coffee/10 bg-cream/30 p-2 shadow-sm">
                      <div
                        className="h-14 w-12 rounded-lg bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${photo.preview})` }}
                      />
                      <p className="min-w-0 flex-1 truncate text-xs font-bold text-coffee">
                        Ảnh phụ #{index + 1}
                      </p>
                      <button
                        onClick={() => setPhotos((list) => list.filter((item) => item.id !== photo.id))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-coffee/50 hover:bg-rose-100 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-4 text-[11px] font-semibold text-coffee/60 leading-relaxed">
              💡 Ảnh mới sẽ được tải lên và cập nhật ngay sau khi bạn bấm nút "Lưu thay đổi".
            </p>

            {previewPhotos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-coffee/10">
                <p className="text-xs font-bold uppercase tracking-wider text-coffee/50 mb-2.5">Xem trước Album</p>
                <div className="grid grid-cols-3 gap-2">
                  {previewPhotos.slice(0, 6).map((url, i) => (
                    <div
                      key={`${url}-${i}`}
                      className="aspect-[3/4] rounded-xl bg-cover bg-center border border-coffee/10 shadow-sm"
                      style={{ backgroundImage: `url(${url})` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Tiêu chí Match mong muốn" icon={<Target />}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                  Đối tượng tìm kiếm
                </label>
                <select
                  className="w-full h-11 rounded-xl border border-coffee/15 bg-white px-3.5 font-semibold text-coffee outline-none focus:border-caramel transition"
                  value={form.preferences.preferredGender}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preferences: { ...form.preferences, preferredGender: e.target.value }
                    })
                  }
                >
                  <option value="all">Tất cả mọi người</option>
                  <option value="same">Cùng giới tính</option>
                  <option value="opposite">Khác giới tính</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                  Độ tuổi phù hợp
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <Input
                    type="number"
                    min={18}
                    placeholder="Từ"
                    className="rounded-xl h-11"
                    value={form.preferences.ageRange.min}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        preferences: {
                          ...form.preferences,
                          ageRange: { ...form.preferences.ageRange, min: Number(e.target.value) }
                        }
                      })
                    }
                  />
                  <Input
                    type="number"
                    max={80}
                    placeholder="Đến"
                    className="rounded-xl h-11"
                    value={form.preferences.ageRange.max}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        preferences: {
                          ...form.preferences,
                          ageRange: { ...form.preferences.ageRange, max: Number(e.target.value) }
                        }
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                  Khoảng cách tối đa (Bán kính km)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  className="rounded-xl h-11"
                  value={form.preferences.maxDistanceKm}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preferences: { ...form.preferences, maxDistanceKm: Number(e.target.value) }
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-2">
                  Ưu tiên thuật toán
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorities.map((item) => (
                    <Chip
                      key={item}
                      selected={form.preferences.priorities.includes(item)}
                      onClick={() =>
                        setForm({
                          ...form,
                          preferences: {
                            ...form.preferences,
                            priorities: toggle(form.preferences.priorities, item)
                          }
                        })
                      }
                    >
                      {priorityLabels[item] ?? item}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Khu vực & GPS" icon={<MapPin />}>
            <div className="space-y-4">
              <div
                className={`rounded-2xl p-4 text-xs font-bold leading-relaxed border ${form.location.source === "gps"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-latte/50 border-caramel/20 text-cocoa"
                  }`}
              >
                {form.location.source === "gps"
                  ? "🛰️ Đang sử dụng tọa độ GPS thực tế. Thuật toán Discovery sẽ tính toán chính xác từ vị trí hiện tại của bạn."
                  : `📍 Đang chọn khu vực thủ công: ${form.location.addressLabel}.`}
              </div>

              <Button
                variant="ghost"
                onClick={useGps}
                className="w-full rounded-xl border border-coffee/15 h-11 font-bold shadow-sm flex items-center justify-center gap-2"
                icon={<Compass className="h-4 w-4 text-caramel" />}
              >
                Cập nhật theo GPS thực tế
              </Button>

              <div className="grid gap-3 pt-2 border-t border-coffee/10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                    Thành phố
                  </label>
                  <select
                    className="w-full h-11 rounded-xl border border-coffee/15 bg-white px-3.5 font-semibold text-coffee outline-none focus:border-caramel transition"
                    value={selectedLocation.city}
                    onChange={(e) => chooseManualLocation(districtsFor(e.target.value)[0].label)}
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-coffee/60 mb-1.5">
                    Quận / Huyện
                  </label>
                  <select
                    className="w-full h-11 rounded-xl border border-coffee/15 bg-white px-3.5 font-semibold text-coffee outline-none focus:border-caramel transition"
                    value={selectedLocation.label}
                    onChange={(e) => chooseManualLocation(e.target.value)}
                  >
                    {districtChoices.map((choice) => (
                      <option key={choice.label} value={choice.label}>
                        {choice.district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Panel>

          <Button
            className="w-full rounded-xl h-12 font-bold shadow-md text-base"
            icon={<Save className="h-5 w-5" />}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Đang lưu thay đổi..." : "Lưu thay đổi"}
          </Button>

          <Button
            className="w-full rounded-xl h-11 font-bold border border-coffee/15"
            variant="ghost"
            onClick={() => navigate("/app/profile")}
          >
            Quay lại xem hồ sơ
          </Button>
        </aside>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-coffee/15 shadow-2xl p-4 md:px-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel/15 text-caramel font-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-coffee">Bạn đang ở chế độ chỉnh sửa hồ sơ</p>
              <p className="text-xs font-medium text-coffee/65 hidden sm:block">
                Đảm bảo chọn đủ số lượng thẻ tối thiểu để hồ sơ của bạn đạt độ phù hợp cao nhất
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              onClick={() => navigate("/app/profile")}
              className="rounded-xl border border-coffee/15 h-11 px-4 font-bold"
            >
              Hủy
            </Button>
            <Button
              icon={<Save className="h-4 w-4" />}
              onClick={save}
              disabled={saving}
              className="rounded-xl px-6 h-11 font-bold shadow-lg shadow-caramel/25"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  badge,
  children
}: {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-coffee/10 bg-white p-6 md:p-8 shadow-soft">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-coffee/10 pb-4">
        <h2 className="flex items-center gap-2.5 text-lg sm:text-xl font-black text-coffee">
          {icon ? <span className="text-caramel">{icon}</span> : null}
          {title}
        </h2>
        {badge}
      </div>
      {children}
    </section>
  );
}
