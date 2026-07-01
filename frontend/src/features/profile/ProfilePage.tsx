import { CalendarDays, Coffee, Images, LogOut, MapPin, Settings, ShieldCheck, UserCircle, UsersRound } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

const fallbackPhoto = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop";

const genderLabel: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
  prefer_not: "Không tiết lộ"
};

export function ProfilePage() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get("/users/profile").then((res) => updateUser({ ...res.data.user, id: res.data.user._id })).catch(() => undefined);
  }, [updateUser]);

  const tags = user?.onboarding?.cafeStyles ?? [];
  const goals = user?.onboarding?.goals ?? [];
  const interests = user?.onboarding?.interests ?? [];
  const photos = useMemo(() => [user?.avatarUrl, ...(user?.profilePhotos ?? [])].filter(Boolean) as string[], [user?.avatarUrl, user?.profilePhotos]);
  const gallery = photos.length ? photos : [fallbackPhoto];
  const heroPhoto = broken[gallery[0]] ? fallbackPhoto : gallery[0];

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Me</p>
          <h1 className="text-3xl font-black">Hồ sơ</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/app/settings"><Button variant="ghost" icon={<Settings />}>Chỉnh sửa</Button></Link>
          <Button variant="ghost" icon={<LogOut />} onClick={() => { logout(); navigate("/auth", { replace: true }); }}>Đăng xuất</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-lg bg-white shadow-soft">
          <div className="relative h-[520px] overflow-hidden bg-coffee/10 sm:h-[640px]">
            <img src={heroPhoto} alt="" className="h-full w-full object-cover" onError={() => setBroken((map) => ({ ...map, [gallery[0]]: true }))} />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/92 via-cocoa/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
              <div className="flex items-end gap-4">
                <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[1.3rem] border-4 border-white bg-latte text-cocoa shadow-soft">
                  {user?.avatarUrl && !broken[user.avatarUrl] ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setBroken((map) => ({ ...map, [user.avatarUrl!]: true }))} />
                  ) : (
                    <UserCircle className="h-12 w-12" />
                  )}
                </div>
                <div>
                  <h2 className="text-4xl font-black">{user?.displayName ?? "UNI-MATE user"}, {user?.age ?? "18+"}</h2>
                  <p className="mt-1 font-semibold text-white/82">{user?.school || "Sinh viên"} {user?.major ? `· ${user.major}` : ""}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-7">
            <div className="grid gap-3 md:grid-cols-2">
              <Info icon={<CalendarDays />} label="Cung" value={user?.zodiac || "Đang cập nhật"} />
              <Info icon={<UsersRound />} label="Giới tính" value={genderLabel[user?.gender || "prefer_not"] ?? "Không tiết lộ"} />
              <Info icon={<MapPin />} label="Khu vực" value={user?.location?.addressLabel || "TP.HCM"} />
              <Info icon={<ShieldCheck />} label="Trạng thái" value={user?.onboardingCompleted ? "Hồ sơ hoàn tất" : "Chưa onboarding"} />
            </div>

            <Section title="Gu cafe" icon={<Coffee />}>
              {tags.length ? tags.map((tag: string) => <Pill key={tag} tone="latte">{tag}</Pill>) : <Empty />}
            </Section>
            <Section title="Mục tiêu gặp">
              {goals.length ? goals.map((goal: string) => <Pill key={goal}>{goal}</Pill>) : <Empty />}
            </Section>
            <Section title="Sở thích">
              {interests.length ? interests.map((interest: string) => <Pill key={interest}>{interest}</Pill>) : <Empty />}
            </Section>
          </div>
        </motion.section>

        <aside className="space-y-4">
          <div className="rounded-lg bg-white p-5 shadow-soft">
            <h3 className="flex items-center gap-2 font-black"><Images className="h-5 w-5 text-caramel" /> Ảnh hồ sơ</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {gallery.slice(0, 6).map((photo, i) => {
                const src = broken[photo] ? fallbackPhoto : photo;
                return <img key={`${photo}-${i}`} src={src} alt="" className="aspect-[3/4] rounded-lg object-cover" onError={() => setBroken((map) => ({ ...map, [photo]: true }))} />;
              })}
            </div>
            <Link to="/app/settings" className="mt-4 block"><Button className="w-full" variant="ghost">Thêm / sửa ảnh</Button></Link>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-soft">
            <h3 className="font-black">Matching preferences</h3>
            <div className="mt-3 grid gap-2 text-sm font-medium text-coffee/72">
              <p>Giới tính muốn tìm: {user?.onboarding?.preferences?.preferredGender ?? "all"}</p>
              <p>Tuổi: {user?.onboarding?.preferences?.ageRange?.min ?? 18} - {user?.onboarding?.preferences?.ageRange?.max ?? 28}</p>
              <p>Khoảng cách: {user?.onboarding?.preferences?.maxDistanceKm ?? 10} km</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-cream p-4">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-caramel">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-coffee/50">{label}</p>
        <p className="font-black">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 font-black">{icon ? <span className="text-caramel">{icon}</span> : null}{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({ children, tone = "cream" }: { children: ReactNode; tone?: "cream" | "latte" }) {
  return <span className={`rounded-full px-3 py-1 text-sm font-bold ${tone === "latte" ? "bg-latte text-cocoa" : "bg-cream text-coffee"}`}>{children}</span>;
}

function Empty() {
  return <span className="text-sm text-coffee/62">Chưa cập nhật</span>;
}
