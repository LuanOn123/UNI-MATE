import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();
  if (!accessToken || !user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/app/discovery" replace />;
  if (!adminOnly && user.role === "admin" && location.pathname.startsWith("/app")) return <Navigate to="/admin/dashboard" replace />;
  const canSkipOnboarding = user.role === "partner" || location.pathname === "/app/partner-register" || location.pathname.startsWith("/app/partner");
  if (!adminOnly && !user.onboardingCompleted && !location.pathname.startsWith("/onboarding") && !canSkipOnboarding) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
