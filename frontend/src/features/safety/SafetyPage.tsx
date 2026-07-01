import { Coffee, EyeOff, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function SafetyPage() {
  const items = [
    [Coffee, "Cafe-gated chat", "Chat chỉ mở sau khi hai bên thống nhất một quán cafe công cộng."],
    [MapPin, "Không lộ tọa độ chính xác", "Discovery dùng khu vực và khoảng cách tương đối, không show tọa độ thật của người khác."],
    [ShieldAlert, "Report đúng ngữ cảnh", "Report nằm trong profile, match và chat để admin có dữ liệu xử lý."],
    [EyeOff, "Block khóa hai chiều", "Khi block, hai bên không xuất hiện lại trong discovery/chat."]
  ];

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Safety</p>
        <h1 className="text-3xl font-black">An toàn</h1>
        <p className="mt-2 max-w-2xl text-coffee/70">MVP ưu tiên kết nối có mục tiêu rõ và gặp ở địa điểm công cộng. Những thao tác report/block chính nằm ngay trong chat và match.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map(([Icon, title, text], i) => {
          const Component = Icon as any;
          return (
            <motion.div key={String(title)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg bg-white p-5 shadow-soft">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-latte text-cocoa">
                <Component />
              </div>
              <h2 className="font-black">{String(title)}</h2>
              <p className="mt-2 text-sm text-coffee/70">{String(text)}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg bg-white p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-black"><ShieldCheck className="text-caramel" /> Gợi ý khi gặp ngoài đời</h2>
        <div className="mt-3 grid gap-2 text-sm font-medium text-coffee/72">
          <p>Chọn quán đông người, dễ tìm đường.</p>
          <p>Không chia sẻ thông tin nhạy cảm trong lần đầu trò chuyện.</p>
          <p>Dùng report/block nếu cuộc trò chuyện làm bạn không thoải mái.</p>
        </div>
      </div>
    </div>
  );
}
