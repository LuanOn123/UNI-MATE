import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuthStore } from "../../stores/authStore";
import { AuthShell } from "./AuthShell";

export function OtpPage() {
  const { pendingEmail, isLoading, sendOtp, verifyOtp } = useAuthStore();
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  if (!pendingEmail) return <Navigate to="/auth" replace />;

  const verify = async () => {
    setError("");
    try {
      const user = await verifyOtp(pendingEmail, code);
      navigate(user.role === "admin" ? "/admin/dashboard" : user.onboardingCompleted ? "/app/discovery" : "/onboarding");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "OTP sai hoặc đã hết hạn");
    }
  };

  const resend = async () => {
    setError("");
    try {
      await sendOtp(pendingEmail);
      setCountdown(60);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không gửi lại được OTP");
    }
  };

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-latte text-cocoa pulse-ring">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-black">Xác thực OTP</h2>
        <p className="mt-2 text-sm text-coffee/70">Mã xác thực đã được gửi tới {pendingEmail}.</p>
        <div className="mt-6 space-y-4">
          <Input
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-[0.35em]"
          />
          {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <Button className="w-full" disabled={isLoading || code.length !== 6} onClick={verify}>
            {isLoading ? "Đang kiểm tra..." : "Xác nhận"}
          </Button>
          <Button className="w-full" variant="ghost" disabled={isLoading || countdown > 0} onClick={resend}>
            {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : "Gửi lại mã"}
          </Button>
        </div>
      </motion.div>
    </AuthShell>
  );
}
