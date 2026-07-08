import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Coffee, Lock, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuthStore } from "../../stores/authStore";
import { registerPartner } from "../auth/authApi";

const schema = z.object({
  partnerName: z.string().min(2, "Tên chủ quán tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"]
});
type FormData = z.infer<typeof schema>;

export function PartnerAuthPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, accessToken, setSession } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user && accessToken && user.role === "partner") {
    return <Navigate to="/app/partner/dashboard" replace />;
  }

  const onSubmit = async (data: FormData) => {
    setError("");
    setLoading(true);
    try {
      const payload = await registerPartner(data.email, data.password, data.partnerName);
      setSession({ user: payload.user, accessToken: payload.accessToken, refreshToken: payload.refreshToken });
      navigate("/app/partner/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#d4a574,transparent_35%),linear-gradient(135deg,#fff7ed,#ffffff,#f5e6d3)] px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-coffee to-cocoa text-white shadow-lg">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-cocoa">UNI-MATE</h1>
          <p className="mt-1 text-sm font-medium text-coffee/60">Dành cho Đối tác Quán cafe</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-coffee/8 bg-white/90 p-8 shadow-soft backdrop-blur">
          <div className="mb-6">
            <h2 className="text-xl font-black text-cocoa">Đăng ký tài khoản Partner</h2>
            <p className="mt-1 text-sm text-coffee/60">
              Tạo tài khoản để quản lý quán, tạo voucher, và tiếp cận hàng nghìn sinh viên trên UNI-MATE.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Tên chủ quán */}
            <div>
              <label className="mb-1 block text-sm font-bold text-coffee">Tên chủ quán / Người đại diện *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee/40" />
                <Input placeholder="Nguyễn Văn A" className="pl-10" {...register("partnerName")} />
              </div>
              {errors.partnerName && <p className="mt-1 text-sm text-rose-600">{errors.partnerName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-bold text-coffee">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee/40" />
                <Input placeholder="partner@email.com" autoComplete="email" className="pl-10" {...register("email")} />
              </div>
              {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="mb-1 block text-sm font-bold text-coffee">Mật khẩu *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee/40" />
                <Input type="password" placeholder="Tối thiểu 8 ký tự (A-z, 0-9)" autoComplete="new-password" className="pl-10" {...register("password")} />
              </div>
              {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="mb-1 block text-sm font-bold text-coffee">Xác nhận mật khẩu *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee/40" />
                <Input type="password" placeholder="Nhập lại mật khẩu" autoComplete="new-password" className="pl-10" {...register("confirmPassword")} />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p>}
            </div>

            {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

            <Button className="w-full" disabled={loading} icon={<Building2 className="h-4 w-4" />}>
              {loading ? "Đang xử lý..." : "Tạo tài khoản Partner"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 border-t border-coffee/10 pt-5">
            <p className="text-center text-xs text-coffee/50">
              Sau khi tạo tài khoản, bạn có thể đăng ký quán từ trang Dashboard.
            </p>
            <div className="flex items-center justify-center gap-1 text-sm">
              <span className="text-coffee/60">Đã có tài khoản?</span>
              <Link to="/auth" className="font-bold text-caramel hover:underline">Đăng nhập</Link>
            </div>
            <div className="flex items-center justify-center gap-1 text-sm">
              <Coffee className="h-3.5 w-3.5 text-coffee/40" />
              <Link to="/" className="text-coffee/50 hover:text-coffee hover:underline">Về trang chủ UNI-MATE</Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
