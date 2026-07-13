import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthShell } from "./AuthShell";
import { resetPassword, sendPasswordResetOtp, verifyPasswordResetOtp } from "./authApi";

const emailSchema = z.string().email("Email không hợp lệ");
const otpSchema = z.string().regex(/^\d{6}$/, "Mã OTP gồm 6 chữ số");
const passwordSchema = z.string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự")
  .regex(/[a-z]/, "Mật khẩu cần có ít nhất 1 chữ thường")
  .regex(/[A-Z]/, "Mật khẩu cần có ít nhất 1 chữ hoa")
  .regex(/[0-9]/, "Mật khẩu cần có ít nhất 1 số");

type Step = "email" | "otp" | "password";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendCode = async () => {
    setError("");
    setMessage("");
    const parsedEmail = emailSchema.safeParse(email.trim());
    if (!parsedEmail.success) {
      setError(parsedEmail.error.issues[0]?.message ?? "Email không hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetOtp(parsedEmail.data);
      setEmail(parsedEmail.data);
      setStep("otp");
      setMessage("Đã gửi mã OTP đến Gmail đã đăng ký. Vui lòng kiểm tra hộp thư.");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không thể gửi OTP lúc này.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setMessage("");
    const parsedOtp = otpSchema.safeParse(otp.trim());
    if (!parsedOtp.success) {
      setError(parsedOtp.error.issues[0]?.message ?? "Mã OTP không hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      const token = await verifyPasswordResetOtp(email, parsedOtp.data);
      setResetToken(token);
      setStep("password");
      setMessage("OTP chính xác. Bây giờ bạn có thể đặt mật khẩu mới.");
    } catch (e: any) {
      setError(e.response?.data?.message ?? "OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    setError("");
    setMessage("");
    const parsedPassword = passwordSchema.safeParse(newPassword);
    if (!parsedPassword.success) {
      setError(parsedPassword.error.issues[0]?.message ?? "Mật khẩu mới không hợp lệ.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!resetToken) {
      setError("Phiên đổi mật khẩu đã hết hạn. Vui lòng lấy OTP mới.");
      setStep("email");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword, confirmPassword);
      setMessage("Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
      window.setTimeout(() => navigate("/auth", { replace: true }), 900);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Không thể đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-5 flex items-center gap-3 text-caramel">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-latte text-cocoa">
            {step === "password" ? <KeyRound /> : step === "otp" ? <ShieldCheck /> : <MailCheck />}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["email", "otp", "password"] as Step[]).map((item) => (
              <span key={item} className={`h-2 w-10 rounded-full ${item === step ? "bg-caramel" : "bg-coffee/12"}`} />
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-black">Quên mật khẩu</h2>
        <p className="mt-2 text-sm text-coffee/70">
          {step === "email" ? "Nhập Gmail đã đăng ký để nhận mã OTP." : null}
          {step === "otp" ? "Nhập mã OTP 6 số vừa được gửi đến Gmail của bạn." : null}
          {step === "password" ? "OTP đã xác nhận. Hãy đặt mật khẩu mới cho tài khoản." : null}
        </p>

        <div className="mt-6 space-y-4">
          {step === "email" ? (
            <>
              <Input placeholder="you@school.edu.vn" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="button" onClick={sendCode} disabled={loading} className="w-full">
                {loading ? "Đang gửi OTP..." : "Gửi OTP qua Gmail"}
              </Button>
            </>
          ) : null}

          {step === "otp" ? (
            <>
              <div className="rounded-lg bg-cream/70 px-3 py-2 text-sm font-semibold text-coffee/70">
                OTP đã gửi tới <span className="font-black text-cocoa">{email}</span>
              </div>
              <Input placeholder="Mã OTP 6 số" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
              <Button type="button" onClick={verifyOtp} disabled={loading} className="w-full">
                {loading ? "Đang xác nhận..." : "Xác nhận OTP"}
              </Button>
              <Button type="button" variant="ghost" onClick={sendCode} disabled={loading} className="w-full">
                Gửi lại OTP
              </Button>
            </>
          ) : null}

          {step === "password" ? (
            <>
              <Input type="password" placeholder="Mật khẩu mới" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Input type="password" placeholder="Xác nhận mật khẩu mới" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <p className="rounded-lg bg-cream/70 px-3 py-2 text-xs font-semibold leading-relaxed text-coffee/65">
                Mật khẩu cần tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 số.
              </p>
              <Button type="button" onClick={changePassword} disabled={loading} className="w-full">
                {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </Button>
            </>
          ) : null}

          {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        </div>

        <Link to="/auth" className="mt-4 block text-center text-sm font-bold text-caramel hover:text-coffee">
          Quay lại đăng nhập
        </Link>
      </motion.div>
    </AuthShell>
  );
}
