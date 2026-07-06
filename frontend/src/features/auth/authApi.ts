import { api } from "../../services/api";
import type { User } from "../../types";

type AuthPayload = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = AuthPayload | { requiresTwoFactor: true; email: string };

function unwrap<T>(response: { data: any }): T {
  return (response.data.data ?? response.data) as T;
}

export async function sendOtp(email: string) {
  await api.post("/auth/send-otp", { email });
}

export async function register(email: string, password: string) {
  const response = await api.post("/auth/register", { email, password });
  return unwrap<AuthPayload>(response);
}

export async function registerPartner(email: string, password: string, partnerName: string) {
  const response = await api.post("/auth/register-partner", { email, password, partnerName });
  return unwrap<AuthPayload>(response);
}

export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", { email, password });
  return unwrap<LoginPayload>(response);
}

export async function verifyOtp(email: string, otp: string) {
  const response = await api.post("/auth/verify-otp", { email, otp });
  return unwrap<AuthPayload>(response);
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return unwrap<{ user: User }>(response).user;
}

export async function logout() {
  await api.post("/auth/logout");
}
