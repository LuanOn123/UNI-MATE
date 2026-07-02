import { Camera, Save, Trash2, Upload } from "lucide-react";
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
import { cafeStyles, goals, interests, preferredTimes, priorities } from "../../utils/options";

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
    displayName: user?.displayName ?? "",
    birthDate: toDateInput(user?.birthDate),
    gender: user?.gender ?? "prefer_not",
    school: user?.school ?? "",
    major: user?.major ?? "",
    avatarUrl: user?.avatarUrl ?? "",
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
    preferences: {
      preferredGender: onboarding.preferences?.preferredGender ?? "all",
      ageRange: {
        min: onboarding.preferences?.ageRange?.min ?? 18,
        max: onboarding.preferences?.ageRange?.max ?? 28
      },
      maxDistanceKm: onboarding.preferences?.maxDistanceKm ?? 10,
      priorities: onboarding.preferences?.priorities ?? ["nearby", "same_interest"]
    },
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
    api.get("/users/profile").then((res) => {
      const fresh = { ...res.data.user, id: res.data.user._id } as User;
      updateUser(fresh);
      setForm(buildForm(fresh));
      setAvatarPreview(displayUrl(fresh.avatarUrl));
      setPhotos(photoDrafts(fresh));
    }).catch(() => undefined);
  }, [updateUser]);

  const previewPhotos = useMemo(() => [avatarPreview, ...photos.map((photo) => photo.preview)].filter(Boolean), [avatarPreview, photos]);
  const selectedLocation = findLocation(form.location.addressLabel);
  const districtChoices = districtsFor(selectedLocation.city);

  const chooseManualLocation = (label: string) => {
    const choice = findLocation(label);
    setForm({ ...form, location: manualLocationPayload(choice) });
  };

  const save = async () => {
    setError("");
    setSaved("");
    if (!form.displayName.trim() || !form.birthDate) return setError("Tên và ngày sinh là bắt buộc.");
    if (form.cafeStyles.length < 3) return setError("Bạn cần chọn ít nhất 3 tags cafe.");
    if (form.goals.length < 1) return setError("Bạn cần chọn ít nhất 1 mục tiêu.");
    if (form.interests.length < 3) return setError("Bạn cần chọn ít nhất 3 sở thích.");
    setSaving(true);
    try {
      const avatarUrl = avatarFile ? await uploadPhoto(avatarFile, "avatar") : form.avatarUrl;
      const profilePhotos = await Promise.all(photos.map((photo) => photo.file ? uploadPhoto(photo.file, "photo") : Promise.resolve(photo.url ?? "")));
      const payload = { ...form, avatarUrl, profilePhotos: profilePhotos.filter(Boolean) };
      await api.post("/users/onboarding", payload);
      const { data } = await api.get("/users/profile");
      const fresh = { ...data.user, id: data.user._id } as User;
      updateUser(fresh);
      setForm(buildForm(fresh));
      setAvatarFile(null);
      setAvatarPreview(displayUrl(fresh.avatarUrl));
      setPhotos(photoDrafts(fresh));
      setSaved("Đã cập nhật hồ sơ.");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không lưu được hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  const chipGrid = (items: string[], key: "goals" | "preferredTimes" | "cafeStyles" | "interests") => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Chip key={item} selected={(form[key] as string[]).includes(item)} onClick={() => setForm({ ...form, [key]: toggle(form[key] as string[], item) })}>
          {item}
        </Chip>
      ))}
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
      (pos) => setForm({ ...form, location: { lat: pos.coords.latitude, lng: pos.coords.longitude, addressLabel: "GPS hiện tại", source: "gps" } }),
      () => setError("Không lấy được GPS. Vui lòng cấp quyền vị trí cho trình duyệt.")
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/app/profile" className="text-sm font-bold text-caramel">← Hồ sơ</Link>
          <h1 className="mt-2 text-3xl font-black">Chỉnh sửa hồ sơ</h1>
        </div>
        <Button icon={<Save />} onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
      {saved ? <p className="mb-4 rounded-lg bg-mint p-3 text-sm font-bold text-cocoa">{saved}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <Panel title="Thông tin cơ bản">
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Tên hiển thị" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              <select className="w-full rounded-lg border border-coffee/15 bg-white p-3 outline-none focus:ring-4 focus:ring-caramel/30" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="prefer_not">Không tiết lộ giới tính</option>
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
                <option value="other">Khác</option>
              </select>
              <Input placeholder="Trường" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
              <Input placeholder="Ngành / lĩnh vực" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
            </div>
          </Panel>

          <Panel title="Mục tiêu gặp">{chipGrid(goals, "goals")}</Panel>
          <Panel title="Gu cafe">
            <h3 className="mb-2 text-sm font-black text-coffee/65">Thời gian rảnh</h3>
            {chipGrid(preferredTimes, "preferredTimes")}
            <h3 className="mb-2 mt-5 text-sm font-black text-coffee/65">Style quán</h3>
            {chipGrid(cafeStyles, "cafeStyles")}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <select className="rounded-lg border border-coffee/15 p-3" value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}>
                <option value="under_40">Dưới 40k</option>
                <option value="40_70">40-70k</option>
                <option value="70_120">70-120k</option>
                <option value="above_120">Trên 120k</option>
              </select>
              <select className="rounded-lg border border-coffee/15 p-3" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option value="rarely">Hiếm khi</option>
                <option value="weekly">Hàng tuần</option>
                <option value="few_times_week">Vài lần/tuần</option>
                <option value="daily">Mỗi ngày</option>
              </select>
            </div>
          </Panel>

          <Panel title="Sở thích">{chipGrid(interests, "interests")}</Panel>

          <Panel title="Chỉ số tính cách">
            <div className="grid gap-3">
              {Object.entries({ introvertExtrovert: "Hướng nội - Hướng ngoại", talkListen: "Lắng nghe - Nói chuyện", newPeopleComfort: "Cần thời gian - Dễ bắt chuyện", studyChillBalance: "Học nghiêm túc - Chill", plannedSpontaneous: "Kế hoạch - Ngẫu hứng" }).map(([key, label]) => (
                <label key={key} className="rounded-lg bg-cream p-4">
                  <div className="mb-2 flex justify-between text-sm font-bold"><span>{label}</span><span>{(form.personality as any)[key]}</span></div>
                  <input type="range" min={1} max={5} value={(form.personality as any)[key]} onChange={(e) => setForm({ ...form, personality: { ...form.personality, [key]: Number(e.target.value) } })} className="w-full accent-caramel" />
                </label>
              ))}
            </div>
          </Panel>
        </main>

        <aside className="space-y-5">
          <Panel title="Ảnh hồ sơ">
            <div className="grid gap-3">
              <label className="block cursor-pointer rounded-lg border border-dashed border-coffee/25 bg-cream p-4 text-center font-bold text-coffee">
                <Upload className="mx-auto mb-2 h-5 w-5 text-caramel" /> Chọn ảnh chính từ máy
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
              </label>
              <label className="block cursor-pointer rounded-lg border border-dashed border-coffee/25 bg-white p-4 text-center font-bold text-coffee shadow-sm">
                <Camera className="mx-auto mb-2 h-5 w-5 text-caramel" /> Thêm ảnh phụ
                <input type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto(e.target.files?.[0])} />
              </label>
              {photos.map((photo) => (
                <div key={photo.id} className="flex items-center gap-3 rounded-lg bg-cream p-2">
                  <div className="h-16 w-12 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${photo.preview})` }} />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">Ảnh phụ {photos.findIndex((item) => item.id === photo.id) + 1}</p>
                  <Button variant="ghost" icon={<Trash2 />} onClick={() => setPhotos((list) => list.filter((item) => item.id !== photo.id))} />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-coffee/60">Ảnh được preview trước, chỉ upload và lưu khi bạn bấm Lưu thay đổi.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {previewPhotos.slice(0, 6).map((url, i) => <div key={`${url}-${i}`} className="aspect-[3/4] rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />)}
            </div>
          </Panel>

          <Panel title="Gu tìm kiếm">
            <div className="grid gap-3">
              <select className="rounded-lg border border-coffee/15 p-3" value={form.preferences.preferredGender} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, preferredGender: e.target.value } })}>
                <option value="all">Tất cả</option>
                <option value="same">Cùng giới</option>
                <option value="opposite">Khác giới</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min={18} value={form.preferences.ageRange.min} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, ageRange: { ...form.preferences.ageRange, min: Number(e.target.value) } } })} />
                <Input type="number" max={80} value={form.preferences.ageRange.max} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, ageRange: { ...form.preferences.ageRange, max: Number(e.target.value) } } })} />
              </div>
              <Input type="number" min={1} max={20} value={form.preferences.maxDistanceKm} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, maxDistanceKm: Number(e.target.value) } })} />
              <div className="flex flex-wrap gap-2">
                {priorities.map((item) => <Chip key={item} selected={form.preferences.priorities.includes(item)} onClick={() => setForm({ ...form, preferences: { ...form.preferences, priorities: toggle(form.preferences.priorities, item) } })}>{item}</Chip>)}
              </div>
            </div>
          </Panel>

          <Panel title="Khu vực">
            <div className="grid gap-3">
              <p className={`rounded-lg p-3 text-sm font-bold ${form.location.source === "gps" ? "bg-mint text-cocoa" : "bg-latte text-cocoa"}`}>
                {form.location.source === "gps" ? "Đang dùng GPS thật, Discovery sẽ ưu tiên vị trí hiện tại." : `Đang dùng khu vực: ${form.location.addressLabel}.`}
              </p>
              <Button variant="ghost" onClick={useGps}>Dùng GPS thật</Button>
              <div className="grid gap-3 md:grid-cols-2">
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
            </div>
          </Panel>
          <Button className="w-full" icon={<Save />} onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          <Button className="w-full" variant="ghost" onClick={() => navigate("/app/profile")}>Xem hồ sơ</Button>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}
