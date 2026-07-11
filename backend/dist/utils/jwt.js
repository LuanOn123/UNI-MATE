import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
function toPayload(user) {
    const userId = user.id ?? String(user._id);
    return { userId, email: user.email, role: user.role };
}
export function signAccessToken(user) {
    return jwt.sign(toPayload(user), env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });
}
export function signRefreshToken(user) {
    return jwt.sign(toPayload(user), env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
export function signPasswordResetToken(user) {
    const payload = { ...toPayload(user), purpose: "password_reset" };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "10m" });
}
export function verifyPasswordResetToken(token) {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (payload.purpose !== "password_reset") {
        throw new Error("Invalid password reset token");
    }
    return payload;
}
