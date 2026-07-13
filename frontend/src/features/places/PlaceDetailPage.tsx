import {
  AirVent,
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  MapPin,
  Plug,
  Sparkles,
  Star,
  Ticket,
  Users,
  Wifi
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import type { Place } from "../../types";

const tagLabels: Record<string, string> = {
  quiet: "Yên tĩnh",
  study: "Học bài",
  work_friendly: "Làm việc",
  chill: "Chill",
  acoustic: "Nhạc acoustic",
  view: "View đẹp",
  photo_spot: "Chụp ảnh",
  boardgame: "Boardgame",
  group_friendly: "Đi nhóm",
  date_friendly: "Hẹn gặp"
};

const amenityLabels: Record<string, string> = {
  wifi: "Wifi",
  power: "Ổ cắm",
  parking: "Gửi xe",
  air_con: "Máy lạnh",
  pet_friendly: "Cho thú cưng",
  outdoor_seating: "Chỗ ngồi ngoài trời"
};

const priceLabels: Record<string, string> = {
  $: "Dưới 30k/người",
  $$: "30k - 60k/người",
  $$$: "60k - 100k/người",
  $$$$: "Trên 100k/người"
};

export function PlaceDetailPage() {
  const { placeId } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [savingVoucherId, setSavingVoucherId] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placeId) return;
    setLoading(true);
    Promise.all([
      api.get(`/places/${placeId}`).then((r) => setPlace(r.data.place)),
      api.get(`/places/${placeId}/vouchers`).then((r) => setVouchers(r.data.vouchers)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, [placeId]);

  const handleSaveVoucher = async (voucher: any) => {
    if (!place?._id || !voucher?._id) return;
    setSavingVoucherId(voucher._id);
    setVoucherError("");
    try {
      await api.post(`/places/${place._id}/vouchers/${voucher._id}/save`);
      await navigator.clipboard.writeText(voucher.code);
      setCopiedCode(voucher.code);
      setVouchers((items) => items.map((item) => item._id === voucher._id ? { ...item, savedByMe: true, currentUsageCount: (item.currentUsageCount ?? 0) + 1 } : item));
      setTimeout(() => setCopiedCode(null), 2500);
    } catch (e: any) {
      setVoucherError(e.response?.data?.message ?? "Không lưu được voucher. Vui lòng thử lại.");
    } finally {
      setSavingVoucherId(null);
    }
  };

  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("wifi")) return <Wifi className="h-4 w-4 text-caramel" />;
    if (lower.includes("power") || lower.includes("ổ cắm") || lower.includes("sạc")) return <Plug className="h-4 w-4 text-caramel" />;
    if (lower.includes("air_con") || lower.includes("máy lạnh") || lower.includes("điều hòa")) return <AirVent className="h-4 w-4 text-caramel" />;
    if (lower.includes("group") || lower.includes("nhóm")) return <Users className="h-4 w-4 text-caramel" />;
    return <CheckCircle2 className="h-4 w-4 text-caramel" />;
  };

  if (loading || !place) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8 animate-pulse space-y-6">
        <div className="h-5 w-32 rounded bg-coffee/10" />
        <div className="h-80 rounded-2xl bg-coffee/10" />
        <div className="space-y-4 p-4">
          <div className="h-8 w-1/2 rounded bg-coffee/10" />
          <div className="h-4 w-3/4 rounded bg-coffee/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      {/* Back link */}
      <Link
        to="/app/places"
        className="inline-flex items-center gap-2 text-sm font-bold text-coffee/70 transition hover:text-caramel"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách quán
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 overflow-hidden rounded-3xl border border-coffee/10 bg-white shadow-soft"
      >
        {/* Banner Image */}
        <div
          className="relative h-80 md:h-96 bg-cover bg-center"
          style={{
            backgroundImage: `url(${
              place.imageUrl ||
              "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1400&auto=format&fit=crop"
            })`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute left-6 top-6 flex flex-wrap gap-2.5">
            {place.isPartnerPlace ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-caramel px-4 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur-md">
                <Award className="h-4 w-4" />
                Đối tác chính thức UNI-MATE
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-white">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{place.name}</h1>
              <p className="mt-2.5 flex items-center gap-2 text-sm md:text-base font-medium text-white/90">
                <MapPin className="h-5 w-5 shrink-0 text-caramel" />
                <span>{place.address ?? place.city}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-md p-3 text-coffee shadow-lg">
              <div className="flex items-center gap-1.5 rounded-xl bg-cream px-3 py-1.5 font-black text-caramel">
                <Star className="h-5 w-5 fill-caramel text-caramel" />
                <span className="text-lg">{place.rating ?? "N/A"}</span>
              </div>
              <div className="text-xs font-bold text-coffee/70">
                <p>{place.userRatingsTotal ?? 0} lượt</p>
                <p className="text-[11px] text-coffee/50">đánh giá</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Description */}
          {place.description ? (
            <div className="rounded-2xl bg-cream/60 p-5 border border-coffee/5">
              <p className="text-base font-medium leading-relaxed text-coffee/85">{place.description}</p>
            </div>
          ) : null}

          {/* Info Grid */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-coffee/10 bg-white p-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-caramel/10 text-caramel">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-coffee/50">Giờ mở cửa</p>
                <p className="mt-0.5 text-base font-bold text-coffee">{place.openingHours || "Đang cập nhật"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-coffee/10 bg-white p-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-caramel/10 text-caramel">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-coffee/50">Mức giá trung bình</p>
                <p className="mt-0.5 text-base font-bold text-coffee">{priceLabels[place.priceLevel ?? "$$"] ?? "30k - 60k/người"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-coffee/10 bg-white p-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-caramel/10 text-caramel">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-coffee/50">Phong cách không gian</p>
                <p className="mt-0.5 text-base font-bold text-coffee">
                  {place.cafeVibe === "quiet_study"
                    ? "Học tập & làm việc"
                    : place.cafeVibe === "acoustic_view"
                    ? "Trò chuyện & chill"
                    : place.cafeVibe === "boardgame_lively"
                    ? "Nhóm bạn & boardgame"
                    : "Quán cà phê"}
                </p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {place.amenities?.length ? (
            <div>
              <h2 className="mb-3.5 text-lg font-black text-coffee flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-caramel" />
                Tiện ích & Cơ sở vật chất
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {place.amenities.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-xl border border-coffee/10 bg-cream/80 px-4 py-2 text-sm font-bold text-coffee"
                  >
                    {getAmenityIcon(item)}
                    <span>{amenityLabels[item] ?? item}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Tags */}
          {place.tags?.length ? (
            <div>
              <h2 className="mb-3.5 text-lg font-black text-coffee">Từ khóa & Đặc trưng</h2>
              <div className="flex flex-wrap gap-2">
                {place.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-xl bg-latte/60 border border-caramel/20 px-3.5 py-1.5 text-sm font-bold text-cocoa"
                  >
                    #{tagLabels[tag] ?? tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Vouchers Section */}
          {vouchers.length > 0 && (
            <div className="rounded-3xl border-2 border-caramel/30 bg-gradient-to-br from-cream/90 via-latte/40 to-white p-6 shadow-md">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-caramel text-white shadow-sm">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-coffee">Ưu đãi độc quyền cho sinh viên UNI-MATE</h2>
                    <p className="text-xs font-semibold text-coffee/65">Lưu mã vào ví và xuất trình tại quầy thu ngân</p>
                  </div>
                </div>
              </div>
              {voucherError ? <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{voucherError}</p> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {vouchers.map((v) => {
                  const isCopied = copiedCode === v.code;
                  const isSaved = Boolean(v.savedByMe);
                  const isSaving = savingVoucherId === v._id;
                  return (
                    <div
                      key={v._id}
                      className="relative flex flex-col justify-between rounded-2xl border border-caramel/25 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-block rounded-md bg-caramel/15 px-2.5 py-1 text-xs font-black text-caramel">
                            GIẢM {v.discountPercent}%
                          </span>
                          <span className="text-[11px] font-bold text-coffee/50">
                            HSD: {new Date(v.expiresAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <h3 className="mt-3 text-base font-black text-coffee">{v.title}</h3>
                        {v.description && (
                          <p className="mt-1 text-xs font-medium text-coffee/70">{v.description}</p>
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-coffee/15 pt-4">
                        <div className="font-mono text-base font-black tracking-wider text-caramel">
                          {v.code}
                        </div>
                        <button
                          onClick={() => handleSaveVoucher(v)}
                          disabled={isSaving}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                            isSaved || isCopied
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-coffee text-white hover:bg-caramel"
                          }`}
                        >
                          {isSaving ? (
                            "Đang lưu..."
                          ) : isSaved || isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Đã lưu
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Lưu mã
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-coffee/10 flex flex-wrap gap-4">
            {place.mapsUrl ? (
              <a href={place.mapsUrl} target="_blank" rel="noreferrer">
                <Button className="h-12 px-6 rounded-xl font-bold shadow-md" icon={<ExternalLink className="h-4 w-4" />}>
                  Xem đường đi trên Google Maps
                </Button>
              </a>
            ) : null}
          </div>
        </div>
      </motion.article>
    </div>
  );
}
