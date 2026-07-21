import { zodResolver } from "@hookform/resolvers/zod";
import { Coffee, Lock, Mail, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuthStore } from "../../stores/authStore";
import { AuthShell } from "./AuthShell";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(/[a-z]/, "Mật khẩu cần có ít nhất 1 chữ thường")
    .regex(/[A-Z]/, "Mật khẩu cần có ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu cần có ít nhất 1 số"),
  confirmPassword: z.string().optional()
});
type FormData = z.infer<typeof schema>;

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, isLoading, login, register: registerUser } = useAuthStore();
  const redirectTo = typeof location.state?.from === "string" ? location.state.from : "";
  const isPartnerRegisterRedirect = redirectTo === "/app/partner-register";
  const nextUserPath = (nextUser = user) => {
    if (nextUser?.role === "partner") return redirectTo?.startsWith("/app/partner") ? redirectTo : "/app/partner/dashboard";
    if (isPartnerRegisterRedirect) return redirectTo;
    return nextUser?.onboardingCompleted ? redirectTo || "/app/discovery" : "/onboarding";
  };

  const formSchema = mode === "register"
    ? schema.refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"]
      })
    : schema;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  if (user && accessToken) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : nextUserPath(user)} replace />;
  }

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      if (mode === "register") {
        const created = await registerUser(data.email, data.password);
        navigate(nextUserPath(created));
        return;
      }
      const loggedInUser = await login(data.email, data.password);
      navigate(loggedInUser.role === "admin" ? "/admin/dashboard" : nextUserPath(loggedInUser));
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
          Mọi tài khoản đều đăng nhập trực tiếp bằng email và mật khẩu.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input placeholder="you@school.edu.vn" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-rose-600">{errors.email.message}</p> : null}
          <Input type="password" placeholder="Mật khẩu" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} />
          {mode === "register" ? (
            <p className="rounded-lg bg-cream/70 px-3 py-2 text-xs font-semibold leading-relaxed text-coffee/65">
              Mật khẩu cần tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 số. Ví dụ: <span className="font-black text-cocoa">Test12345</span>
            </p>
          ) : null}
          {errors.password ? <p className="text-sm text-rose-600">{errors.password.message}</p> : null}
          {mode === "login" ? (
            <div className="text-right">
              <Link to="/auth/forgot-password" className="text-sm font-bold text-caramel hover:text-coffee">
                Quên mật khẩu?
              </Link>
            </div>
          ) : null}
          {mode === "register" && (
            <>
              <Input type="password" placeholder="Xác nhận mật khẩu" autoComplete="new-password" {...register("confirmPassword")} />
              {errors.confirmPassword ? <p className="text-sm text-rose-600">{errors.confirmPassword.message}</p> : null}
            </>
          )}
          {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <Button className="w-full" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo hồ sơ"}
          </Button>
        </form>
      </motion.div>
    </AuthShell>
  );
}
