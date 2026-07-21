import { Check, Clock, Copy, MapPin, Store, Ticket, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";

type SavedVoucher = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  discountPercent: number;
  maxUsageCount: number;
  currentUsageCount: number;
  expiresAt: string;
  isActive: boolean;
  placeId?: {
    _id: string;
    name: string;
    address?: string;
    district?: string;
    city?: string;
    imageUrl?: string;
    status?: string;
  };
};

function voucherStatus(voucher: SavedVoucher) {
  const expired = new Date(voucher.expiresAt).getTime() <= Date.now();
  const exhausted = voucher.maxUsageCount > 0 && voucher.currentUsageCount >= voucher.maxUsageCount;
  const hiddenPlace = voucher.placeId?.status && voucher.placeId.status !== "active";
  if (!voucher.isActive) return { label: "Đã tạm dừng", tone: "bg-slate-100 text-slate-600" };
  if (expired) return { label: "Hết hạn", tone: "bg-rose-50 text-rose-700" };
  if (exhausted) return { label: "Hết lượt", tone: "bg-amber-50 text-amber-700" };
  if (hiddenPlace) return { label: "Quán tạm ẩn", tone: "bg-slate-100 text-slate-600" };
  return { label: "Có thể dùng", tone: "bg-emerald-50 text-emerald-700" };
}

export function SavedVouchersPage() {
  const [vouchers, setVouchers] = useState<SavedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    api.get("/places/saved-vouchers")
      .then((res) => setVouchers(res.data.vouchers ?? []))
      .finally(() => setLoading(false));
  }, []);

  const usableCount = useMemo(() => vouchers.filter((voucher) => voucherStatus(voucher).label === "Có thể dùng").length, [vouchers]);

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode((current) => current === code ? "" : current), 2200);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="mb-6 h-10 w-56 animate-pulse rounded-lg bg-coffee/10" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-white shadow-soft" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-24 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-caramel/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-caramel">
            <WalletCards className="h-3.5 w-3.5" />
            Ví ưu đãi
          </div>
          <h1 className="mt-2 text-3xl font-black text-coffee md:text-4xl">Voucher đã lưu</h1>
          <p className="mt-1 text-sm font-semibold text-coffee/60">
            Bạn đang có {usableCount}/{vouchers.length} mã còn có thể dùng tại quán.
          </p>
        </div>
        <Link to="/app/places">
          <Button variant="ghost" icon={<Store className="h-4 w-4" />}>Khám phá quán</Button>
        </Link>
      </div>

      {!vouchers.length ? (
        <StateBlock title="Chưa có voucher nào" text="Vào chi tiết quán, bấm Lưu mã để thêm ưu đãi vào ví của bạn." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vouchers.map((voucher) => {
            const status = voucherStatus(voucher);
            const place = voucher.placeId;
            const canOpenPlace = place?._id && place.status === "active";
            const copied = copiedCode === voucher.code;
            return (
              <article key={voucher._id} className="overflow-hidden rounded-2xl border border-coffee/10 bg-white shadow-soft">
                <div
                  className="relative h-28 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${place?.imageUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=900&auto=format&fit=crop"})`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa/78 via-cocoa/10 to-transparent" />
                  <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-black ${status.tone}`}>
                    {status.label}
                  </span>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h2 className="line-clamp-1 text-lg font-black">{place?.name ?? "Quán UNI-MATE"}</h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-white/80">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{place?.address || [place?.district, place?.city].filter(Boolean).join(", ") || "Địa chỉ đang cập nhật"}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-caramel/12 px-2.5 py-1 text-xs font-black text-caramel">
                        <Ticket className="h-3.5 w-3.5" />
                        GIẢM {voucher.discountPercent}%
                      </span>
                      <h3 className="mt-2 font-black text-cocoa">{voucher.title}</h3>
                      {voucher.description ? <p className="mt-1 text-sm font-semibold text-coffee/60">{voucher.description}</p> : null}
                    </div>
                    <div className="text-right text-xs font-bold text-coffee/50">
                      <Clock className="ml-auto h-4 w-4" />
                      <p className="mt-1">{new Date(voucher.expiresAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-coffee/15 bg-cream/60 p-3">
                    <span className="font-mono text-base font-black tracking-wider text-caramel">{voucher.code}</span>
                    <button
                      type="button"
                      onClick={() => copyCode(voucher.code)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition ${copied ? "bg-emerald-600 text-white" : "bg-coffee text-white hover:bg-caramel"}`}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Đã copy" : "Copy"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs font-semibold text-coffee/50">
                    <span>Đã lưu vào ví của bạn</span>
                    {canOpenPlace ? <Link className="font-black text-caramel hover:text-coffee" to={`/app/places/${place._id}`}>Xem quán</Link> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
