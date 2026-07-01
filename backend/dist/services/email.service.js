import nodemailer from "nodemailer";
import { env } from "../config/env.js";
function hasSmtpConfig() {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}
export function canSendRealEmail() {
    return hasSmtpConfig();
}
export async function sendOtpEmail(email, otp) {
    if (!hasSmtpConfig()) {
        if (env.NODE_ENV === "production") {
            throw new Error("SMTP is not configured");
        }
        console.warn("[EMAIL] Real email is not configured. OTP email was not sent.");
        return;
    }
    const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
    });
    await transporter.sendMail({
        from: env.MAIL_FROM,
        to: email,
        subject: "Mã OTP đăng nhập UNI-MATE",
        text: `Mã OTP đăng nhập UNI-MATE của bạn là ${otp}. Mã này hết hạn sau ${env.OTP_EXPIRES_MINUTES} phút. Không chia sẻ mã này với bất kỳ ai.`,
        html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2d2118;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 12px;color:#3b2418">Mã OTP đăng nhập UNI-MATE</h2>
        <p>Chào bạn,</p>
        <p>Dùng mã OTP dưới đây để hoàn tất đăng nhập hoặc đăng ký UNI-MATE:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f6eadf;border-radius:8px;padding:18px 22px;text-align:center;color:#3b2418">${otp}</div>
        <p style="margin-top:18px">Mã OTP hết hạn sau <strong>${env.OTP_EXPIRES_MINUTES} phút</strong>.</p>
        <p style="font-size:13px;color:#7a6a5d">Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>
      </div>
    `
    });
}
