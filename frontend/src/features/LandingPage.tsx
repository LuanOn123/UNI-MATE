import { Coffee, HeartHandshake, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CoffeeMeter } from "../components/common/CoffeeMeter";
import { PublicFooter } from "../components/common/PublicFooter";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-cocoa">
      <section className="relative min-h-[92vh] overflow-hidden bg-[linear-gradient(rgba(63,45,36,.22),rgba(63,45,36,.58)),url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1800&auto=format&fit=crop')] bg-cover bg-center px-5 text-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between py-5">
          <div className="flex items-center gap-3 text-xl font-black">
            <Coffee className="h-7 w-7" /> UNI-MATE
          </div>
          <Link to="/auth">
            <Button variant="ghost" className="bg-white text-coffee">
              Bắt đầu
            </Button>
          </Link>
        </nav>

        <div className="mx-auto grid min-h-[72vh] max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_.95fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="mb-4 inline-flex rounded-full bg-white/16 px-4 py-2 text-sm font-bold backdrop-blur">
              Cafe-gated chat cho sinh viên và người trẻ
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">Tìm bạn cafe hợp gu quanh bạn</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              Thích nhau chưa đủ để chat. Hai bạn cùng chốt một quán cafe công cộng trước, rồi phòng chat mới mở để hẹn thời gian.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button className="bg-caramel px-6 text-base hover:bg-coffee" icon={<Sparkles />}>
                  Tạo hồ sơ
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="ghost" className="bg-white/90 px-6 text-base text-coffee">
                  Đăng nhập
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
              <span>Bạn là chủ quán cafe?</span>
              <Link to="/app/partner-register" className="font-bold text-white underline underline-offset-2 hover:text-caramel">
                Đăng ký quán đối tác
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, rotate: 4, y: 24 }}
            animate={{ opacity: 1, rotate: 0, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="float-card hidden rounded-[2rem] border border-white/20 bg-white/18 p-4 shadow-soft backdrop-blur-xl md:block"
          >
            <div className="overflow-hidden rounded-[1.5rem] bg-white text-cocoa">
              <div className="h-72 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Minh, 19</h2>
                    <p className="text-sm font-semibold text-coffee/65">CNTT - Quận 1</p>
                  </div>
                  <div className="rounded-lg bg-cream px-3 py-2">
                    <CoffeeMeter value={86} size="sm" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
                  {["Yên tĩnh", "Có ổ cắm", "Học nhóm"].map((tag) => (
                    <span key={tag} className="rounded-full bg-cream px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button variant="ghost">Bỏ qua</Button>
                  <Button icon={<HeartHandshake />}>Thích</Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 md:grid-cols-3">
        {[
          ["Tạo gu cafe", "Chọn mục tiêu, thời gian rảnh, tags quán và khu vực."],
          ["Match có lý do", "Gợi ý được xếp hạng theo tags chung, vị trí, tuổi và sở thích."],
          ["Chốt quán rồi chat", "Một bên đề xuất quán, bên còn lại đồng ý thì chat mới mở."]
        ].map(([title, text], i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-lg bg-white p-6 shadow-soft"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-latte font-black text-cocoa">{i + 1}</div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 text-coffee/70">{text}</p>
          </motion.div>
        ))}
      </section>

      <section className="bg-white px-5 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black">Không phải dating app. Là một lời mời cafe rõ ràng.</h2>
            <p className="mt-3 text-coffee/75">
              UNI-MATE đặt địa điểm công cộng vào giữa cuộc trò chuyện để kết nối có mục tiêu hơn và an toàn hơn cho MVP học thuật.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-cream p-4 font-semibold">
              <MapPin className="text-caramel" /> Ưu tiên quán gần khu vực của cả hai
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-cream p-4 font-semibold">
              <ShieldCheck className="text-caramel" /> Report và block có mặt ở các điểm nhạy cảm
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
