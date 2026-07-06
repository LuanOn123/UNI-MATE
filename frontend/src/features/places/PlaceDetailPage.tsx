import { ExternalLink, MapPin, Star, Wifi, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import type { Place } from "../../types";

export function PlaceDetailPage() {
  const { placeId } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/places/${placeId}`).then((r) => setPlace(r.data.place));
    api.get(`/places/${placeId}/vouchers`).then((r) => setVouchers(r.data.vouchers)).catch(() => {});
  }, [placeId]);

  if (!place) return <div className="p-6"><StateBlock title="Đang tải quán" text="Thông tin quán cafe sẽ hiển thị trong giây lát." /></div>;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <Link to="/app/places" className="text-sm font-bold text-caramel">← Quán cafe</Link>
      <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-4 overflow-hidden rounded-lg bg-white shadow-soft">
        <div className="h-72 bg-cover bg-center" style={{ backgroundImage: `url(${place.imageUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1400&auto=format&fit=crop"})` }} />
        <div className="p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black">{place.name}</h1>
              <p className="mt-3 flex gap-2 text-coffee/70"><MapPin className="h-5 w-5 shrink-0 text-caramel" />{place.address}</p>
            </div>
            <div className="rounded-lg bg-cream px-4 py-3 font-black">
              <span className="flex items-center gap-2"><Star className="h-5 w-5 fill-caramel text-caramel" />{place.rating ?? "N/A"}</span>
              <p className="text-xs font-bold text-coffee/55">{place.userRatingsTotal ?? 0} đánh giá</p>
            </div>
          </div>
          {place.description ? <p className="mt-5 text-coffee/80">{place.description}</p> : null}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-cream p-4">
              <p className="text-sm font-bold text-coffee/55">Giờ mở cửa</p>
              <p className="mt-1 font-semibold">{place.openingHours || "Đang cập nhật"}</p>
            </div>
            <div className="rounded-lg bg-cream p-4">
              <p className="text-sm font-bold text-coffee/55">Mức giá</p>
              <p className="mt-1 font-semibold">{place.priceLevel ?? "$$"}</p>
            </div>
          </div>
          {place.amenities?.length ? (
            <div className="mt-5">
              <h2 className="mb-2 font-black">Tiện ích</h2>
              <div className="flex flex-wrap gap-2">{place.amenities.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 text-sm font-bold"><Wifi className="h-4 w-4 text-caramel" />{item}</span>)}</div>
            </div>
          ) : null}
          {place.tags?.length ? <div className="mt-5 flex flex-wrap gap-2">{place.tags.map((tag) => <span key={tag} className="rounded-full bg-latte px-3 py-1 text-sm font-bold text-cocoa">{tag}</span>)}</div> : null}
          
          {vouchers.length > 0 && (
            <div className="mt-6 rounded-xl border border-caramel/20 bg-latte/30 p-5">
              <h2 className="mb-3 flex items-center gap-2 font-black text-caramel">
                <Ticket className="h-5 w-5" /> Ưu đãi từ quán
              </h2>
              <div className="space-y-3">
                {vouchers.map(v => (
                  <div key={v._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-coffee/10 bg-white p-3 shadow-sm">
                    <div>
                      <p className="font-bold text-cocoa">{v.title}</p>
                      {v.description && <p className="mt-0.5 text-xs text-coffee/60">{v.description}</p>}
                      <p className="mt-1 text-xs font-semibold text-coffee/40">HSD: {new Date(v.expiresAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <div className="rounded border-2 border-dashed border-caramel/40 bg-cream px-3 py-1.5 text-center">
                      <p className="text-[10px] font-bold text-coffee/50">MÃ GIẢM {v.discountPercent}%</p>
                      <p className="font-black tracking-wider text-caramel">{v.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {place.mapsUrl ? <a href={place.mapsUrl} target="_blank" rel="noreferrer"><Button className="mt-6" icon={<ExternalLink />}>Mở bản đồ</Button></a> : null}
        </div>
      </motion.article>
    </div>
  );
}
