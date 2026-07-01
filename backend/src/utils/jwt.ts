import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtUser = {
  id?: string;
  _id?: unknown;
  email: string;
  role: "user" | "admin";
};

export type JwtPayload = {
  userId: string;
  email: string;
  role: "user" | "admin";
};

function toPayload(user: JwtUser): JwtPayload {
  const userId = user.id ?? String(user._id);
  return { userId, email: user.email, role: user.role };
}

export function signAccessToken(user: JwtUser) {
  return jwt.sign(toPayload(user), env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"] });
}

export function signRefreshToken(user: JwtUser) {
  return jwt.sign(toPayload(user), env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
