import { MapPin, Search, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import type { Place } from "../../types";

export function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/places").then((r) => setPlaces(r.data.places)).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter((place) => [place.name, place.address, place.district, ...(place.tags ?? [])].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [places, query]);

  if (loading) return <div className="p-6"><StateBlock title="Đang tải quán cafe" /></div>;
  if (!places.length) return <div className="p-6"><StateBlock title="Chưa có quán active" text="Admin cần thêm hoặc hiển thị quán cafe để người dùng xem danh sách." /></div>;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Places</p>
          <h1 className="text-3xl font-black">Quán cafe</h1>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee/45" />
          <Input className="pl-10" placeholder="Tìm quán, khu vực, tag" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((place, i) => (
          <motion.div key={place._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}>
            <Link to={`/app/places/${place._id}`} className="block overflow-hidden rounded-lg bg-white shadow-soft transition hover:-translate-y-0.5">
              <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${place.imageUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=900&auto=format&fit=crop"})` }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black">{place.name}</h3>
                  <span className="flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-xs font-black">
                    <Star className="h-3.5 w-3.5 fill-caramel text-caramel" /> {place.rating ?? "N/A"}
                  </span>
                </div>
                <p className="mt-2 flex gap-2 text-sm text-coffee/70"><MapPin className="h-4 w-4 shrink-0" />{place.address ?? place.city}</p>
                {place.tags?.length ? <div className="mt-3 flex flex-wrap gap-2">{place.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-cream px-2 py-1 text-xs font-bold text-coffee">{tag}</span>)}</div> : null}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      {!visible.length ? <div className="mt-8"><StateBlock title="Không tìm thấy quán phù hợp" /></div> : null}
    </div>
  );
}
