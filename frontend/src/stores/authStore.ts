import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingEmail: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setPendingEmail: (email: string) => void;
  setSession: (payload: { user: User; accessToken: string; refreshToken?: string }) => void;
  clearSession: () => void;
  updateUser: (user: User) => void;
  register: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<{ user?: User; requiresTwoFactor?: boolean }>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<User>;
  fetchMe: () => Promise<User | null>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      pendingEmail: null,
      isAuthenticated: false,
      isLoading: false,
      setPendingEmail: (email) => set({ pendingEmail: email }),
      setSession: ({ user, accessToken, refreshToken }) => set((state) => ({
        user,
        accessToken,
        refreshToken: refreshToken ?? state.refreshToken,
        isAuthenticated: true
      })),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateUser: (user) => set({ user }),
      register: async (email, password) => {
        set({ isLoading: true });
        try {
          const { register } = await import("../features/auth/authApi");
          const payload = await register(email, password);
          set({
            user: payload.user,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
            isAuthenticated: true,
            pendingEmail: null
          });
          return payload.user;
        } finally {
          set({ isLoading: false });
        }
      },
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { login } = await import("../features/auth/authApi");
          const payload = await login(email, password);
          if (!("accessToken" in payload)) {
            set({ pendingEmail: payload.email });
            return { requiresTwoFactor: true };
          }
          set({
            user: payload.user,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
            isAuthenticated: true,
            pendingEmail: null
          });
          return { user: payload.user };
        } finally {
          set({ isLoading: false });
        }
      },
      sendOtp: async (email) => {
        set({ isLoading: true });
        try {
          const { sendOtp } = await import("../features/auth/authApi");
          await sendOtp(email);
          set({ pendingEmail: email });
        } finally {
          set({ isLoading: false });
        }
      },
      verifyOtp: async (email, otp) => {
        set({ isLoading: true });
        try {
          const { verifyOtp } = await import("../features/auth/authApi");
          const payload = await verifyOtp(email, otp);
          set({
            user: payload.user,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
            isAuthenticated: true,
            pendingEmail: null
          });
          return payload.user;
        } finally {
          set({ isLoading: false });
        }
      },
      fetchMe: async () => {
        const state = useAuthStore.getState();
        if (!state.accessToken) return null;
        set({ isLoading: true });
        try {
          const { getMe } = await import("../features/auth/authApi");
          const user = await getMe();
          set({ user, isAuthenticated: true });
          return user;
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
      logout: () => {
        const token = useAuthStore.getState().accessToken;
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        localStorage.removeItem("uni-mate-auth");
        void import("../lib/socket").then(({ resetSocket }) => resetSocket()).catch(() => undefined);
        if (token) void import("../features/auth/authApi").then(({ logout }) => logout()).catch(() => undefined);
      }
    }),
    { name: "uni-mate-auth" }
  )
);
