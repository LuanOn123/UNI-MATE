import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { loginWithPassword, logout, refreshToken, registerWithPassword, sendEmailOtp, verifyEmailOtp } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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
function setRefreshCookie(res, token) {
    res.cookie("refreshToken", token, { httpOnly: true, sameSite: "lax", secure: env.COOKIE_SECURE, maxAge: 30 * 24 * 3600 * 1000 });
}
export const registerController = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await registerWithPassword(req.body.email, req.body.password);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
});
export const loginController = asyncHandler(async (req, res) => {
    const result = await loginWithPassword(req.body.email, req.body.password);
    if (!("refreshToken" in result))
        return res.json({ success: true, data: result });
    setRefreshCookie(res, result.refreshToken);
    res.json({ success: true, data: result });
});
export const sendOtpController = asyncHandler(async (req, res) => {
    await sendEmailOtp(req.body.email);
    res.json({ success: true, message: "OTP sent" });
});
export const verifyOtpController = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await verifyEmailOtp(req.body.email, req.body.otp ?? req.body.code);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, message: "Login successful", data: { user, accessToken, refreshToken } });
});
export const refreshController = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    const data = await refreshToken(token);
    res.json({ success: true, data });
});
export const meController = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user)
        return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { user: publicUser(user) } });
});
export const logoutController = asyncHandler(async (req, res) => {
    await logout(req.user.id);
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out" });
});
