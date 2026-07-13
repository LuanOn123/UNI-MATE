import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { restoreExpiredSuspension } from "../utils/accountStatus.js";
export async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token)
        return res.status(401).json({ success: false, message: "Missing access token" });
    try {
        const payload = verifyAccessToken(token);
        const user = await User.findById(payload.userId).select("_id email role status isActive suspendedUntil");
        await restoreExpiredSuspension(user);
        if (!user || !user.isActive)
            return res.status(401).json({ success: false, message: "Invalid user" });
        if (user.status === "banned" || user.status === "suspended") {
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đang bị khóa" });
        }
        req.user = { id: String(user._id), email: user.email, role: user.role };
        next();
    }
    catch {
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}
export function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin")
        return res.status(403).json({ success: false, message: "Admin only" });
    next();
}
