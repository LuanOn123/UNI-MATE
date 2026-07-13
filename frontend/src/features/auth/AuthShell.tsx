import type { ReactNode } from "react";
import { Coffee } from "lucide-react";
import { Link } from "react-router-dom";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#f6d7b0,transparent_35%),linear-gradient(135deg,#fff7ed,#ffffff,#ffe4e6)] px-4">
      <div className="w-full max-w-md rounded-lg bg-white/85 p-8 shadow-soft backdrop-blur">
        <Link to="/" className="mb-5 inline-flex text-sm font-bold text-coffee/65 transition hover:text-caramel">
          Quay về trang chủ
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-coffee p-2 text-white"><Coffee /></div>
          <div><h1 className="text-2xl font-black">UNI-MATE</h1><p className="text-sm text-coffee/70">Đăng nhập bằng email OTP</p></div>
        </div>
        {children}
      </div>
    </div>
  );
}
