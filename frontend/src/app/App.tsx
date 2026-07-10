import { Navigate, Route, Routes } from "react-router-dom";
import { AdminAuditPage, AdminDashboardPage, AdminMatchesPage, AdminPlacesPage, AdminReportsPage, AdminTagsPage, AdminUserDetailPage, AdminUsersPage } from "../features/admin/AdminPage";
import { AuthPage } from "../features/auth/AuthPage";
import { PartnerAuthPage } from "../features/auth/PartnerAuthPage";
import { OtpPage } from "../features/auth/OtpPage";
import { ChatListPage } from "../features/chat/ChatListPage";
import { ChatRoomPage } from "../features/chat/ChatRoomPage";
import { DiscoveryPage } from "../features/discovery/DiscoveryPage";
import { LandingPage } from "../features/LandingPage";
import { MatchesPage } from "../features/matches/MatchesPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { PlaceDetailPage } from "../features/places/PlaceDetailPage";
import { PlacesPage } from "../features/places/PlacesPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { SettingsPage } from "../features/profile/SettingsPage";
import { SafetyPage } from "../features/safety/SafetyPage";
import { GroupPage } from "../features/groups/GroupPage";
import { GroupChatPage } from "../features/groups/GroupChatPage";
import { PartnerDashboardPage } from "../features/partner/PartnerDashboardPage";
import { PartnerRegisterPage } from "../features/partner/PartnerRegisterPage";
import { AdminLayout } from "../layouts/AdminLayout";
import { AppLayout } from "../layouts/AppLayout";
import { ProtectedRoute } from "../routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/otp" element={<OtpPage />} />
      <Route path="/partner/auth" element={<PartnerAuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/onboarding/disclaimer" element={<OnboardingPage />} />
        <Route path="/onboarding/basic-info" element={<OnboardingPage />} />
        <Route path="/onboarding/survey-purpose" element={<OnboardingPage />} />
        <Route path="/onboarding/survey-goals" element={<OnboardingPage />} />
        <Route path="/onboarding/survey-cafe" element={<OnboardingPage />} />
        <Route path="/onboarding/survey-personality" element={<OnboardingPage />} />
        <Route path="/onboarding/survey-interests" element={<OnboardingPage />} />
        <Route path="/onboarding/survey-vibe" element={<OnboardingPage />} />
        <Route path="/onboarding/preferences" element={<OnboardingPage />} />
        <Route path="/onboarding/location" element={<OnboardingPage />} />
        <Route path="/onboarding/result" element={<OnboardingPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/discovery" replace />} />
          <Route path="discovery" element={<DiscoveryPage />} />
          <Route path="matches" element={<MatchesPage />} />
          <Route path="chat" element={<ChatListPage />} />
          <Route path="chat/:roomId" element={<ChatRoomPage />} />
          <Route path="places" element={<PlacesPage />} />
          <Route path="places/:placeId" element={<PlaceDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route path="groups" element={<GroupPage />} />
          <Route path="groups/:groupId/chat" element={<GroupChatPage />} />
          <Route path="partner/dashboard" element={<PartnerDashboardPage />} />
          <Route path="partner-register" element={<PartnerRegisterPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="reports/:id" element={<AdminReportsPage />} />
          <Route path="matches" element={<AdminMatchesPage />} />
          <Route path="places" element={<AdminPlacesPage />} />
          <Route path="places-cache" element={<AdminPlacesPage />} />
          <Route path="tags" element={<AdminTagsPage />} />
          <Route path="actions" element={<AdminAuditPage />} />
          <Route path="analytics" element={<AdminDashboardPage />} />
          <Route path="settings" element={<AdminDashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
