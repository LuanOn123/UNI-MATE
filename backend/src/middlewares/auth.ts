import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: "user" | "admin" };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ success: false, message: "Missing access token" });
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).select("_id email role status isActive");
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: "Invalid user" });
    if (user.status === "banned" || user.status === "suspended") {
      return res.status(403).json({ success: false, message: "Tài khoản của bạn đang bị khóa" });
    }
    req.user = { id: String(user._id), email: user.email, role: user.role as "user" | "admin" };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
  next();
}
