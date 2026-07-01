import { zodResolver } from "@hookform/resolvers/zod";
import { Coffee, Lock, Mail, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuthStore } from "../../stores/authStore";
import { AuthShell } from "./AuthShell";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự")
});
type FormData = z.infer<typeof schema>;

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, accessToken, isLoading, login, register: registerUser } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user && accessToken) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : user.onboardingCompleted ? "/app/discovery" : "/onboarding"} replace />;
  }

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      if (mode === "register") {
        const created = await registerUser(data.email, data.password);
        navigate(created.onboardingCompleted ? "/app/discovery" : "/onboarding");
        return;
      }
      const result = await login(data.email, data.password);
      if (result.requiresTwoFactor) {
        navigate("/auth/otp");
        return;
      }
      if (result.user) navigate(result.user.role === "admin" ? "/admin/dashboard" : result.user.onboardingCompleted ? "/app/discovery" : "/onboarding");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không thể xác thực tài khoản");
    }
  };

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-5 flex items-center gap-3 text-caramel">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-latte text-cocoa">
            <Coffee />
          </div>
          <Mail />
          <Lock />
          <Shield />
        </div>
        <div className="mb-5 grid grid-cols-2 rounded-lg bg-cream p-1">
          <button type="button" onClick={() => setMode("login")} className={`rounded-md px-3 py-2 text-sm font-bold transition ${mode === "login" ? "bg-white text-coffee shadow-sm" : "text-coffee/70"}`}>
            Đăng nhập
          </button>
          <button type="button" onClick={() => setMode("register")} className={`rounded-md px-3 py-2 text-sm font-bold transition ${mode === "register" ? "bg-white text-coffee shadow-sm" : "text-coffee/70"}`}>
            Đăng ký
          </button>
        </div>
        <h2 className="text-2xl font-black">{mode === "login" ? "Chào mừng quay lại" : "Tạo tài khoản UNI-MATE"}</h2>
        <p className="mt-2 text-sm text-coffee/70">
          Dùng email và mật khẩu. OTP chỉ xuất hiện khi tài khoản bật 2FA hoặc là admin.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input placeholder="you@school.edu.vn" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-rose-600">{errors.email.message}</p> : null}
          <Input type="password" placeholder="Mật khẩu" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} />
          {errors.password ? <p className="text-sm text-rose-600">{errors.password.message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <Button className="w-full" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo hồ sơ"}
          </Button>
        </form>
      </motion.div>
    </AuthShell>
  );
}
