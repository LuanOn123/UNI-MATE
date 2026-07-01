import { ChevronLeft, ChevronRight, Eye, Heart, MapPin, RotateCcw, ShieldAlert, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoffeeMeter } from "../../components/common/CoffeeMeter";
import { StateBlock } from "../../components/common/StateBlock";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import type { User } from "../../types";

function userId(user?: User | null) {
  return user?._id ?? user?.id ?? "";
}

export function DiscoveryPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-10, 0, 10]);
  const likeOpacity = useTransform(x, [40, 180], [0, 1]);
  const passOpacity = useTransform(x, [-180, -40], [1, 0]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setUsers((await api.get("/discovery")).data.users);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tải được danh sách gợi ý");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (action: "like" | "pass") => {
    const candidate = users[0];
    if (!candidate) return;
    setExpanded(false);
    setDetailOpen(false);
    setPhotoIndex(0);
    setNotice("");
    try {
      const { data } = await api.post(`/discovery/${action}`, { targetUserId: userId(candidate) });
      setUsers((list) => list.slice(1));
      if (data.matched) setMatch(data.match);
      if (action === "like" && !data.matched) setNotice("Đã like. Quán cafe và chat sẽ mở khi người kia cũng like lại bạn.");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không thực hiện được hành động");
    }
  };

  if (loading) return <div className="p-6"><StateBlock title="Đang tìm người hợp gu..." text="UNI-MATE đang xếp hạng theo gu cafe, khu vực và mục tiêu gặp." /></div>;
  if (error && !users.length) return <div className="p-6"><StateBlock title="Có lỗi xảy ra" text={error} /></div>;
  if (!users.length) return <div className="p-6"><StateBlock title="Chưa có gợi ý mới" text="Cập nhật vị trí hoặc mở rộng khoảng cách để có thêm người phù hợp." /></div>;

  const user = users[0];
  const meta = user.matchMeta;
  const tags = [...(meta?.commonTags ?? []), ...(meta?.commonCafeStyles ?? [])].slice(0, 7);
  const photos = [user.avatarUrl, ...(user.profilePhotos ?? [])].filter(Boolean) as string[];
  const gallery = photos.length ? photos : ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop"];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[1fr_320px] md:p-8">
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Discovery</p>
            <h1 className="text-3xl font-black">Khám phá</h1>
          </div>
          <Button variant="ghost" icon={<RotateCcw />} onClick={load}>Làm mới</Button>
        </div>
        {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {notice ? <p className="mb-4 rounded-lg bg-mint p-3 text-sm font-bold text-cocoa">{notice}</p> : null}

        <div className="relative mx-auto min-h-[690px] max-w-[520px] md:min-h-[720px]">
          <AnimatePresence mode="popLayout">
            <motion.article
              key={userId(user)}
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 130) void act("like");
                if (info.offset.x < -130) void act("pass");
              }}
              initial={{ opacity: 0, scale: 0.96, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -20 }}
              transition={{ duration: 0.24 }}
              className="absolute inset-x-0 top-0 overflow-hidden rounded-[1.7rem] bg-white shadow-soft"
            >
              <div className="relative h-[430px] bg-cover bg-center sm:h-[500px]" style={{ backgroundImage: `url(${gallery[0]})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-cocoa/86 via-cocoa/12 to-transparent" />
                <motion.div style={{ opacity: likeOpacity }} className="absolute right-5 top-5 rotate-6 rounded-lg border-4 border-emerald-300 px-4 py-2 text-2xl font-black text-emerald-200">
                  LIKE
                </motion.div>
                <motion.div style={{ opacity: passOpacity }} className="absolute left-5 top-5 -rotate-6 rounded-lg border-4 border-rose-300 px-4 py-2 text-2xl font-black text-rose-200">
                  NOPE
                </motion.div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-4xl font-black">{user.displayName || "UNI-MATE user"}, {user.age ?? "18+"}</h2>
                      <p className="mt-1 font-semibold text-white/82">{user.school || "Sinh viên"} {user.major ? `· ${user.major}` : ""}</p>
                    </div>
                    <div className="rounded-lg bg-white/92 px-3 py-2 text-cocoa">
                      <CoffeeMeter value={meta?.score ?? 70} size="sm" label="match" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {tags.length ? tags.map((tag) => <span key={tag} className="rounded-full bg-cream px-3 py-1 text-sm font-bold text-coffee">{tag}</span>) : <span className="rounded-full bg-cream px-3 py-1 text-sm font-bold text-coffee">Gu cafe gần bạn</span>}
                </div>
                <ul className="mt-4 space-y-2 text-sm font-medium text-coffee/78">
                  {(meta?.reasons ?? ["Có gu cafe và khu vực phù hợp với bạn"]).slice(0, expanded ? 6 : 3).map((reason) => (
                    <li key={reason} className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-caramel" />{reason}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => setDetailOpen(true)} className="mt-3 text-sm font-bold text-caramel">
                  Xem chi tiết hồ sơ
                </button>
                {expanded ? (
                  <div className="mt-4 grid gap-3 rounded-lg bg-cream p-4 text-sm text-coffee/72">
                    <p><b>Giới tính:</b> {user.gender || "Chưa tiết lộ"}</p>
                    <p><b>Khu vực:</b> {user.location?.addressLabel || "TP.HCM"}</p>
                    <p><b>Cung:</b> {user.zodiac || "Đang cập nhật"}</p>
                  </div>
                ) : null}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Button variant="ghost" icon={<X />} onClick={() => act("pass")}>Nope</Button>
                  <Button variant="ghost" icon={<Eye />} onClick={() => setDetailOpen(true)}>Profile</Button>
                  <Button icon={<Heart />} onClick={() => act("like")} className="bg-caramel hover:bg-coffee">Like</Button>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="font-black">Cách mở chat</h2>
          <div className="mt-4 space-y-3 text-sm font-medium text-coffee/72">
            <p>1. Like người hợp gu.</p>
            <p>2. Mutual match sẽ tạo một kết nối.</p>
            <p>3. Hai bên cùng xác nhận một quán cafe.</p>
            <p>4. Chat mở để chốt thời gian gặp.</p>
          </div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-black"><ShieldAlert className="h-5 w-5 text-caramel" /> An toàn</h2>
          <p className="mt-3 text-sm font-medium text-coffee/72">Không hiển thị tọa độ chính xác của người khác. Report/block sẽ có trong match và chat.</p>
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-cream px-3 py-2 text-sm font-bold text-coffee"><MapPin className="h-4 w-4" /> Gặp ở nơi công cộng</p>
        </div>
      </aside>

      {match ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-30 grid place-items-center bg-cocoa/62 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, y: 18 }} animate={{ scale: 1, y: 0 }} className="max-w-md rounded-[1.5rem] bg-white p-8 text-center shadow-soft">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-latte text-cocoa pulse-ring">
              <Heart className="h-8 w-8 fill-caramel text-caramel" />
            </div>
            <h2 className="text-3xl font-black">Mutual Match!</h2>
            <p className="mt-2 text-coffee/70">Hai bạn đã thích nhau. Chọn một quán cafe để mở phòng chat.</p>
            <div className="mt-6 grid gap-3">
              <Button onClick={() => navigate(`/app/matches/${match._id}/places`)}>Xem quán gợi ý</Button>
              <Button variant="ghost" onClick={() => setMatch(null)}>Để sau</Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      {detailOpen ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 grid place-items-center bg-cocoa/65 p-3 backdrop-blur-sm md:p-6">
          <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.4rem] bg-white shadow-soft md:grid md:grid-cols-[minmax(0,1fr)_390px]">
            <div className="relative min-h-[380px] bg-cocoa md:min-h-[760px]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${gallery[photoIndex]})` }} />
              <div className="absolute inset-x-0 top-0 flex gap-1 p-3">
                {gallery.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/35"}`} />)}
              </div>
              <button type="button" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/84 text-cocoa" onClick={() => setPhotoIndex((value) => Math.max(0, value - 1))}>
                <ChevronLeft />
              </button>
              <button type="button" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/84 text-cocoa" onClick={() => setPhotoIndex((value) => Math.min(gallery.length - 1, value + 1))}>
                <ChevronRight />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black">{user.displayName || "UNI-MATE user"}, {user.age ?? "18+"}</h2>
                  <p className="mt-1 font-semibold text-coffee/68">{user.school || "Sinh viên"} {user.major ? `· ${user.major}` : ""}</p>
                </div>
                <button type="button" onClick={() => setDetailOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-coffee"><X /></button>
              </div>
              <div className="mt-5 rounded-lg bg-cream p-4">
                <CoffeeMeter value={meta?.score ?? 70} size="lg" label="độ hợp gu" />
              </div>
              <div className="mt-5 grid gap-3 text-sm font-medium text-coffee/75">
                <p><b>Cung:</b> {user.zodiac || "Đang cập nhật"}</p>
                <p><b>Giới tính:</b> {user.gender || "Chưa tiết lộ"}</p>
                <p><b>Khu vực:</b> {user.location?.addressLabel || "TP.HCM"}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((tag) => <span key={tag} className="rounded-full bg-latte px-3 py-1 text-sm font-bold text-cocoa">{tag}</span>)}
              </div>
              <ul className="mt-5 space-y-2 text-sm font-medium text-coffee/78">
                {(meta?.reasons ?? ["Có gu cafe và khu vực phù hợp với bạn"]).slice(0, 6).map((reason) => (
                  <li key={reason} className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-caramel" />{reason}</li>
                ))}
              </ul>
              <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-3 bg-white pt-3">
                <Button variant="ghost" icon={<X />} onClick={() => act("pass")}>Nope</Button>
                <Button icon={<Heart />} onClick={() => act("like")} className="bg-caramel hover:bg-coffee">Like</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </div>
  );
}
