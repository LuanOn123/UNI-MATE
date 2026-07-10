import { Award, BookOpen, Clock, Coffee, Gamepad2, LayoutGrid, MapPin, Music, Search, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";
import type { Place } from "../../types";

type VibeFilter = "ALL" | "quiet_study" | "acoustic_view" | "boardgame_lively";

export function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState("");
  const [activeVibe, setActiveVibe] = useState<VibeFilter>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/places")
      .then((r) => setPlaces(r.data.places))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((place) => {
      // 1. Lọc theo gu/vibe
      if (activeVibe !== "ALL" && place.cafeVibe !== activeVibe) {
        return false;
      }
      // 2. Lọc theo từ khóa tìm kiếm
      if (!q) return true;
      const searchableText = [
        place.name,
        place.address,
        place.district,
        place.cafeVibe,
        place.partnerName,
        ...(place.tags ?? [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(q);
    });
  }, [places, query, activeVibe]);

  const getVibeIcon = (vibe?: string) => {
    switch (vibe) {
      case "quiet_study":
        return <BookOpen className="h-4 w-4 text-caramel" />;
      case "acoustic_view":
        return <Music className="h-4 w-4 text-caramel" />;
      case "boardgame_lively":
        return <Gamepad2 className="h-4 w-4 text-caramel" />;
      default:
        return <Coffee className="h-4 w-4 text-caramel" />;
    }
  };

  const getVibeLabel = (vibe?: string) => {
    switch (vibe) {
      case "quiet_study":
        return "Yên tĩnh học bài";
      case "acoustic_view":
        return "Acoustic & View chill";
      case "boardgame_lively":
        return "Boardgame & Nhóm";
      default:
        return "Quán cà phê";
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-8 space-y-3 animate-pulse">
          <div className="h-4 w-28 rounded bg-coffee/10" />
          <div className="h-9 w-64 rounded-lg bg-coffee/15" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="overflow-hidden rounded-2xl bg-white shadow-soft animate-pulse">
              <div className="h-48 bg-coffee/10" />
              <div className="p-6 space-y-4">
                <div className="h-6 w-3/4 rounded bg-coffee/10" />
                <div className="h-4 w-full rounded bg-coffee/10" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 rounded-full bg-coffee/10" />
                  <div className="h-6 w-16 rounded-full bg-coffee/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header & Search */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-caramel/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-caramel">
            <Sparkles className="h-3.5 w-3.5" />
            Places & Cafes
          </div>
          <h1 className="mt-2 text-3xl font-black text-coffee md:text-4xl">Khám phá Quán Cà Phê</h1>
          <p className="mt-1 text-sm font-medium text-coffee/65">
            Chọn và xác nhận quán yêu thích để gặp gỡ đối tác và mở khóa phòng Chat 1-1
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee/45" />
          <Input
            className="pl-10 pr-4 h-11 rounded-xl border-coffee/15 bg-white shadow-sm transition focus:border-caramel"
            placeholder="Tìm theo tên, quận, tiện ích..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Vibe Tabs Filter */}
      <div className="mb-8 flex flex-wrap gap-2.5 border-b border-coffee/10 pb-5">
        <button
          onClick={() => setActiveVibe("ALL")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeVibe === "ALL"
              ? "bg-caramel text-white shadow-md shadow-caramel/25"
              : "bg-white text-coffee/75 hover:bg-cream border border-coffee/10"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Tất cả ({places.length})
        </button>
        <button
          onClick={() => setActiveVibe("quiet_study")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeVibe === "quiet_study"
              ? "bg-caramel text-white shadow-md shadow-caramel/25"
              : "bg-white text-coffee/75 hover:bg-cream border border-coffee/10"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Yên tĩnh học bài
        </button>
        <button
          onClick={() => setActiveVibe("acoustic_view")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeVibe === "acoustic_view"
              ? "bg-caramel text-white shadow-md shadow-caramel/25"
              : "bg-white text-coffee/75 hover:bg-cream border border-coffee/10"
          }`}
        >
          <Music className="h-4 w-4" />
          Acoustic & View chill
        </button>
        <button
          onClick={() => setActiveVibe("boardgame_lively")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeVibe === "boardgame_lively"
              ? "bg-caramel text-white shadow-md shadow-caramel/25"
              : "bg-white text-coffee/75 hover:bg-cream border border-coffee/10"
          }`}
        >
          <Gamepad2 className="h-4 w-4" />
          Boardgame & Nhóm
        </button>
      </div>

      {/* Grid Places */}
      {!places.length ? (
        <StateBlock
          title="Chưa có quán active"
          text="Hệ thống đang chuẩn bị dữ liệu hoặc cần Quản trị viên kích hoạt quán."
        />
      ) : !visible.length ? (
        <StateBlock
          title="Không tìm thấy quán phù hợp"
          text="Hãy thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc phong cách khác."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((place, i) => (
            <motion.div
              key={place._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/app/places/${place._id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-coffee/10 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-caramel/40 hover:shadow-xl"
              >
                {/* Banner & Badges */}
                <div
                  className="relative h-48 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${
                      place.imageUrl ||
                      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=900&auto=format&fit=crop"
                    })`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-2">
                    {place.isPartnerPlace ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-caramel px-3 py-1 text-xs font-black text-white shadow-md">
                        <Award className="h-3.5 w-3.5" />
                        Đối tác UNI-MATE
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute right-3.5 top-3.5">
                    <span className="flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-xs font-black text-coffee shadow-sm">
                      <Star className="h-3.5 w-3.5 fill-caramel text-caramel" />
                      {place.rating ?? "N/A"}
                    </span>
                  </div>

                  {/* Vibe overlay at bottom left of image */}
                  <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-bold text-white/95">
                    {getVibeIcon(place.cafeVibe)}
                    <span>{getVibeLabel(place.cafeVibe)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-black text-coffee transition group-hover:text-caramel">
                        {place.name}
                      </h3>
                      {place.priceLevel && (
                        <span className="shrink-0 font-black text-sm text-caramel/90 bg-cream px-2 py-0.5 rounded-md">
                          {place.priceLevel}
                        </span>
                      )}
                    </div>

                    <p className="mt-2.5 flex items-center gap-2 text-sm font-medium text-coffee/70 line-clamp-1">
                      <MapPin className="h-4 w-4 shrink-0 text-caramel" />
                      <span>{place.address ?? place.city}</span>
                    </p>

                    {place.openingHours && (
                      <p className="mt-1.5 flex items-center gap-2 text-xs font-medium text-coffee/55">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Mở cửa: {place.openingHours}</span>
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {place.tags?.length ? (
                    <div className="mt-4 pt-3 border-t border-coffee/5 flex flex-wrap gap-1.5">
                      {place.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-cream px-2.5 py-1 text-xs font-bold text-coffee/80"
                        >
                          {tag}
                        </span>
                      ))}
                      {place.tags.length > 3 && (
                        <span className="rounded-lg bg-cream px-2 py-1 text-xs font-bold text-coffee/60">
                          +{place.tags.length - 3}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
