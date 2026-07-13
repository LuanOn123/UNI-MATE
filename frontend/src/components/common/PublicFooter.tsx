import { Coffee, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-coffee/10 bg-white/88 px-5 py-8 text-cocoa backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3 text-lg font-black">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-coffee text-white">
              <Coffee className="h-5 w-5" />
            </span>
            UNI-MATE
          </div>
          <p className="mt-2 max-w-md text-sm font-semibold text-coffee/62">
            Kết nối sinh viên qua những buổi cafe an toàn, rõ ràng và hợp gu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-coffee/68">
          <Link to="/auth" className="rounded-full px-3 py-2 transition hover:bg-cream hover:text-cocoa">
            Đăng nhập
          </Link>
          <Link to="/app/partner-register" className="rounded-full px-3 py-2 transition hover:bg-cream hover:text-cocoa">
            Đối tác quán
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-caramel" /> An toàn cộng đồng
          </span>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-2">
            <Mail className="h-4 w-4 text-caramel" /> support@uni-mate.local
          </span>
        </div>
      </div>
      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-2 border-t border-coffee/8 pt-4 text-xs font-semibold text-coffee/50 md:flex-row md:items-center md:justify-between">
        <p>© {year} UNI-MATE. Dự án kết nối cafe cho sinh viên.</p>
        <p>Không chia sẻ OTP, mật khẩu hoặc thông tin cá nhân nhạy cảm.</p>
      </div>
    </footer>
  );
}
