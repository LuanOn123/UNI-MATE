import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../config/env.js";
import { EmailOtp } from "../models/EmailOtp.js";
import { User } from "../models/User.js";
import { restoreExpiredSuspension } from "../utils/accountStatus.js";
import { signAccessToken, signPasswordResetToken, signRefreshToken, verifyPasswordResetToken, verifyRefreshToken } from "../utils/jwt.js";
import { canSendRealEmail, sendOtpEmail } from "./email.service.js";
const emailSchema = z.string().email().transform((email) => email.toLowerCase().trim());
const otpSchema = z.string().regex(/^\d{6}$/);
function serviceError(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}
function randomOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function publicUser(user) {
    return {
        id: String(user._id),
        email: user.email,
        role: user.role,
        status: user.status,
        displayName: user.displayName,
        birthDate: user.birthDate,
        age: user.age,
        zodiac: user.zodiac,
        gender: user.gender,
        school: user.school,
        major: user.major,
        avatarUrl: user.avatarUrl,
        profilePhotos: user.profilePhotos ?? [],
        onboardingCompleted: user.onboardingCompleted,
        twoFactorEnabled: user.twoFactorEnabled,
        onboarding: user.onboarding,
        location: user.location
    };
}
async function issueTokens(user) {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    return { accessToken, refreshToken };
}
export async function sendEmailOtp(emailInput) {
    const email = emailSchema.parse(emailInput);
    if (!canSendRealEmail() && env.NODE_ENV === "production") {
        throw serviceError("SMTP is not configured", 500);
    }
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const cooldownAgo = new Date(now.getTime() - env.OTP_RESEND_COOLDOWN_SECONDS * 1000);
    const recentOtp = await EmailOtp.findOne({ email }).sort({ createdAt: -1 });
    if (recentOtp && recentOtp.createdAt > cooldownAgo) {
        throw serviceError(`Please wait ${env.OTP_RESEND_COOLDOWN_SECONDS} seconds before resending OTP`, 429);
    }
    const sendsThisHour = await EmailOtp.countDocuments({ email, createdAt: { $gte: oneHourAgo } });
    if (sendsThisHour >= env.OTP_MAX_SEND_PER_HOUR) {
        throw serviceError("Too many OTP requests. Please try again later.", 429);
    }
    const otp = randomOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await EmailOtp.create({
        email,
        otpHash,
        expiresAt: new Date(now.getTime() + env.OTP_EXPIRES_MINUTES * 60 * 1000),
        resendCount: sendsThisHour
    });
    if (env.DEV_PRINT_OTP) {
        console.log(`[DEV OTP] ${email}: ${otp}`);
    }
    await sendOtpEmail(email, otp);
    return { message: "OTP sent" };
}
export async function registerWithPassword(emailInput, password) {
    const email = emailSchema.parse(emailInput);
    const existing = await User.findOne({ email });
    if (existing)
        throw serviceError("Email already exists", 409);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, emailVerified: true });
    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
}
export async function loginWithPassword(emailInput, password) {
    const email = emailSchema.parse(emailInput);
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash)
        throw serviceError("Invalid email or password", 401);
    await restoreExpiredSuspension(user);
    if (user.status === "banned" || user.status === "suspended" || user.isActive === false) {
        throw serviceError("Account is locked", 403);
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
        throw serviceError("Invalid email or password", 401);
    const requiresTwoFactor = user.role === "admin" || user.twoFactorEnabled;
    if (requiresTwoFactor) {
        await sendEmailOtp(email);
        return { requiresTwoFactor: true, email };
    }
    user.lastLoginAt = new Date();
    user.lastSeenAt = new Date();
    const tokens = await issueTokens(user);
    return { requiresTwoFactor: false, user: publicUser(user), ...tokens };
}
export async function verifyEmailOtp(emailInput, otpInput) {
    const email = emailSchema.parse(emailInput);
    const code = otpSchema.parse(otpInput);
    const otp = await EmailOtp.findOne({ email, consumed: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!otp)
        throw serviceError("OTP does not exist or has expired", 400);
    if (otp.attempts >= env.OTP_MAX_ATTEMPTS)
        throw serviceError("Too many invalid OTP attempts", 429);
    const ok = await bcrypt.compare(code, otp.otpHash);
    if (!ok) {
        otp.attempts += 1;
        await otp.save();
        throw serviceError("Invalid OTP", 400);
    }
    otp.consumed = true;
    await otp.save();
    const user = await User.findOne({ email });
    if (!user)
        throw serviceError("User not found", 404);
    await restoreExpiredSuspension(user);
    if (user.status === "banned" || user.status === "suspended" || user.isActive === false) {
        throw serviceError("Account is locked", 403);
    }
    user.emailVerified = true;
    user.lastLoginAt = new Date();
    user.lastSeenAt = new Date();
    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
}
export async function sendPasswordResetOtp(emailInput) {
    const email = emailSchema.parse(emailInput);
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
        throw serviceError("Email không tồn tại hoặc tài khoản không dùng mật khẩu", 404);
    }
    await sendEmailOtp(email);
    return { message: "OTP sent" };
}
export async function verifyPasswordResetOtp(emailInput, otpInput) {
    const email = emailSchema.parse(emailInput);
    const code = otpSchema.parse(otpInput);
    const otp = await EmailOtp.findOne({ email, consumed: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!otp)
        throw serviceError("OTP không tồn tại hoặc đã hết hạn", 400);
    if (otp.attempts >= env.OTP_MAX_ATTEMPTS)
        throw serviceError("Bạn đã nhập sai OTP quá nhiều lần", 429);
    const ok = await bcrypt.compare(code, otp.otpHash);
    if (!ok) {
        otp.attempts += 1;
        await otp.save();
        throw serviceError("OTP không chính xác", 400);
    }
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
        throw serviceError("Không tìm thấy tài khoản cần đổi mật khẩu", 404);
    }
    await restoreExpiredSuspension(user);
    if (user.status === "banned" || user.status === "suspended" || user.isActive === false) {
        throw serviceError("Tài khoản đang bị khóa", 403);
    }
    otp.consumed = true;
    await otp.save();
    return { resetToken: signPasswordResetToken(user) };
}
export async function resetPasswordWithToken(resetToken, newPassword) {
    let payload;
    try {
        payload = verifyPasswordResetToken(resetToken);
    }
    catch {
        throw serviceError("Phiên đổi mật khẩu đã hết hạn. Vui lòng lấy OTP mới.", 401);
    }
    const user = await User.findById(payload.userId);
    if (!user || user.email !== payload.email || !user.passwordHash) {
        throw serviceError("Không tìm thấy tài khoản cần đổi mật khẩu", 404);
    }
    await restoreExpiredSuspension(user);
    if (user.status === "banned" || user.status === "suspended" || user.isActive === false) {
        throw serviceError("Tài khoản đang bị khóa", 403);
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.refreshTokenHash = undefined;
    await user.save();
    return { message: "Đổi mật khẩu thành công" };
}
export async function refreshToken(token) {
    if (!token)
        throw serviceError("Missing refresh token", 401);
    let payload;
    try {
        payload = verifyRefreshToken(token);
    }
    catch {
        throw serviceError("Invalid refresh token", 401);
    }
    const user = await User.findById(payload.userId);
    await restoreExpiredSuspension(user);
    if (!user || user.status === "banned" || user.status === "suspended" || user.isActive === false) {
        throw serviceError("Invalid user", 403);
    }
    if (!user.refreshTokenHash || !(await bcrypt.compare(token, user.refreshTokenHash))) {
        throw serviceError("Invalid refresh token", 401);
    }
    const accessToken = signAccessToken(user);
    return { user: publicUser(user), accessToken, refreshToken: token };
}
export async function logout(userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}
export const sendOtp = sendEmailOtp;
export const verifyOtp = verifyEmailOtp;
