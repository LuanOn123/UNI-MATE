export async function restoreExpiredSuspension(user: any) {
  if (user?.status !== "suspended" || !user.suspendedUntil || new Date(user.suspendedUntil).getTime() > Date.now()) return false;
  user.status = "active";
  user.isActive = true;
  user.suspendedUntil = undefined;
  await user.save();
  return true;
}
