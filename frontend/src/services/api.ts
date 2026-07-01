import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes("/auth/refresh")) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken ?? undefined;
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, { withCredentials: true });
        const payload = data.data ?? data;
        useAuthStore.getState().setSession({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken
        });
        original.headers.Authorization = `Bearer ${payload.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearSession();
      }
    }
    return Promise.reject(error);
  }
);
