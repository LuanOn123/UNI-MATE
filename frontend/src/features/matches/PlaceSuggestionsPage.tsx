import { Ban, CheckCircle, Clock, Coffee, ExternalLink, MapPin, RotateCcw, Star, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StateBlock } from "../../components/common/StateBlock";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuthStore } from "../../stores/authStore";
import type { Match, Place } from "../../types";

function idOf(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id ?? value.id ?? "";
}

export function PlaceSuggestionsPage() {
  const { matchId } = useParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const currentId = idOf(useAuthStore((s) => s.user));

  const load = async () => {
    if (!matchId) return;
    setLoading(true);
    setError("");
    try {
      const [{ data: matchData }, { data: placesData }] = await Promise.all([
        api.get(`/matches/${matchId}`),
        api.get(`/matches/${matchId}/place-suggestions`)
      ]);
      setMatch(matchData.match);
      setPlaces(placesData.places ?? []);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không tải được gợi ý quán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [matchId]);

  useEffect(() => {
    const socket = getSocket();
    const onMatchUpdated = (payload: any) => {
      if (payload?.matchId === matchId) void load();
    };
    socket.on("match:updated", onMatchUpdated);
    return () => {
      socket.off("match:updated", onMatchUpdated);
    };
  }, [matchId]);

  const selectedByMe = useMemo(() => idOf(match?.selectedBy) === currentId, [match?.selectedBy, currentId]);
  const active = Boolean(match && !["expired", "chat_opened", "blocked", "cancelled"].includes(match.status));
  const canConfirm = Boolean(match?.selectedPlace && !selectedByMe && active);
  const canRejectPlace = canConfirm;
  const canPropose = active;
  const chatRoomId = typeof match?.chatRoom === "string" ? match.chatRoom : match?.chatRoom?._id;

  const select = async (placeId: string) => {
    setError("");
    try {
      setMatch((await api.post(`/matches/${matchId}/select-place`, { placeId })).data.match);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không đề xuất được quán");
    }
  };

  const confirm = async () => {
    setError("");
    try {
      const { data } = await api.post(`/matches/${matchId}/confirm-place`);
      setMatch(data.match);
      if (data.match.status === "chat_opened") navigate(`/app/chat/${data.match.chatRoom._id}`);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Chưa thể xác nhận quán");
    }
  };

  const rejectPlace = async () => {
    setError("");
    try {
      const { data } = await api.post(`/matches/${matchId}/reject-place`);
      setMatch(data.match);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Chưa thể từ chối quán");
    }
  };

  const cancelMatch = async () => {
    setError("");
    try {
      const { data } = await api.post(`/matches/${matchId}/cancel`);
      setMatch(data.match);
      navigate("/app/matches");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Chưa thể hủy match");
    }
  };

  if (loading) return <div className="p-6"><StateBlock title="Đang tải quán gợi ý" /></div>;
  if (!match) return <div className="p-6"><StateBlock title="Không tìm thấy match" /></div>;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Cafe proposal</p>
          <h1 className="text-3xl font-black">Chọn quán cafe</h1>
          <p className="mt-2 max-w-2xl text-coffee/70">Chat chỉ mở khi một bên đề xuất và bên còn lại đồng ý cùng một quán.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/matches"><Button variant="ghost">Về Matches</Button></Link>
          {active ? <Button variant="danger" icon={<Ban />} onClick={cancelMatch}>Hủy match</Button> : null}
        </div>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="rounded-lg bg-white p-5 shadow-soft">
          <div className="flex items-start gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${match.status === "chat_opened" ? "bg-mint" : match.status === "cancelled" ? "bg-rose-50" : match.status === "expired" ? "bg-slate-100" : "bg-latte"}`}>
              {match.status === "chat_opened" ? <CheckCircle className="text-cocoa" /> : match.status === "cancelled" ? <XCircle className="text-rose-600" /> : <Coffee className="text-cocoa" />}
            </div>
            <div className="flex-1">
              <h2 className="font-black">
                {match.status === "chat_opened" ? "Chat đã mở" : match.status === "cancelled" ? "Match đã hủy" : match.status === "expired" ? "Match đã hết hạn" : match.selectedPlace ? "Quán đang chờ chốt" : "Chưa có quán được đề xuất"}
              </h2>
              <p className="mt-1 text-sm text-coffee/70">
                {match.status === "chat_opened"
                  ? "Hai bạn đã thống nhất quán. Vào chat để chốt thời gian."
                  : match.status === "cancelled"
                    ? "Match này đã dừng, hai bên sẽ không mở chat từ đây."
                    : match.status === "expired"
                      ? "Match hết hạn sau 72 giờ nếu chưa xác nhận quán."
                      : match.selectedPlace
                        ? selectedByMe
                          ? "Bạn đã đề xuất quán này. Đang chờ người kia đồng ý hoặc yêu cầu chọn lại."
                          : "Người kia đã đề xuất quán này. Bạn có thể đồng ý, từ chối để họ chọn lại, hoặc hủy match."
                        : "Chọn một trong các quán bên dưới để gửi đề xuất."}
              </p>
            </div>
          </div>
          {match.selectedPlace ? (
            <div className="mt-5 rounded-lg bg-cream p-4">
              <h3 className="text-xl font-black">{match.selectedPlace.name}</h3>
              <p className="mt-2 flex gap-2 text-sm text-coffee/70"><MapPin className="h-4 w-4 shrink-0" />{match.selectedPlace.address}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {canConfirm ? <Button onClick={confirm} icon={<CheckCircle />}>Đồng ý mở chat</Button> : null}
                {canRejectPlace ? <Button variant="ghost" onClick={rejectPlace} icon={<RotateCcw />}>Từ chối quán</Button> : null}
                {match.status === "chat_opened" && chatRoomId ? <Button onClick={() => navigate(`/app/chat/${chatRoomId}`)}>Vào chat</Button> : null}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="font-black">Quy tắc mở chat</h2>
          <div className="mt-4 space-y-3 text-sm font-medium text-coffee/72">
            <p className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-caramel" /> Match hết hạn sau 72 giờ nếu chưa chốt quán.</p>
            <p className="flex gap-2"><Coffee className="h-4 w-4 shrink-0 text-caramel" /> Chỉ proposal active mới nhất được giữ.</p>
            <p className="flex gap-2"><RotateCcw className="h-4 w-4 shrink-0 text-caramel" /> Nếu quán không hợp, người nhận có thể yêu cầu chọn lại.</p>
          </div>
        </aside>
      </div>

      <h2 className="mb-4 text-xl font-black">Gợi ý phù hợp</h2>
      {!places.length ? <StateBlock title="Chưa đủ dữ liệu quán" text="Admin cần thêm quán active hoặc bạn có thể quay lại danh sách quán." /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {places.map((place, i) => (
          <motion.article key={place._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg bg-white p-5 shadow-soft">
            <div className="mb-4 h-36 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${place.imageUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop"})` }} />
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black">{place.name}</h3>
              <span className="flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-xs font-black">
                <Star className="h-3.5 w-3.5 fill-caramel text-caramel" /> {place.rating ?? "N/A"}
              </span>
            </div>
            <p className="mt-2 min-h-10 text-sm text-coffee/70">{place.address}</p>
            {place.tags?.length ? <div className="mt-3 flex flex-wrap gap-2">{place.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-cream px-2 py-1 text-xs font-bold text-coffee">{tag}</span>)}</div> : null}
            <div className="mt-4 flex gap-2">
              <Button onClick={() => select(place._id)} disabled={!canPropose}>Đề xuất</Button>
              {place.mapsUrl ? <a href={place.mapsUrl} target="_blank" rel="noreferrer"><Button variant="ghost" icon={<ExternalLink />} /></a> : null}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
