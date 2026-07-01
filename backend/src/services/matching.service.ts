import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Swipe } from "../models/Swipe.js";
import { Match } from "../models/Match.js";

const kmToRadians = (km: number) => km / 6378.1;

function overlap(a: string[] = [], b: string[] = []) {
  return a.filter((x) => b.includes(x));
}

function genderAllowed(preferredGender: string | undefined, actorGender: string | undefined, targetGender: string | undefined) {
  if (!preferredGender || preferredGender === "all") return true;
  if (preferredGender === "same") return actorGender === targetGender;
  if (preferredGender === "opposite") return actorGender !== targetGender;
  return true;
}

export function scoreUsers(me: any, candidate: any) {
  const interests = overlap(me.onboarding?.interests, candidate.onboarding?.interests);
  const styles = overlap(me.onboarding?.cafeStyles, candidate.onboarding?.cafeStyles);
  const goals = overlap(me.onboarding?.goals, candidate.onboarding?.goals);
  const times = overlap(me.onboarding?.preferredTimes, candidate.onboarding?.preferredTimes);
  let score = 0;
  score += Math.min(25, styles.length * 9);
  score += me.location?.coordinates?.[0] && candidate.location?.coordinates?.[0] ? 20 : 8;
  score += Math.max(0, 15 - Math.abs((me.age ?? 25) - (candidate.age ?? 25)) * 2);
  score += Math.min(10, goals.length * 5);
  if (me.major && candidate.major && me.major === candidate.major) score += 10;
  score += Math.min(10, interests.length * 4);
  score += Math.min(5, times.length * 3);
  if (candidate.lastSeenAt && Date.now() - new Date(candidate.lastSeenAt).getTime() < 7 * 24 * 3600 * 1000) score += 5;
  const reasons = [
    interests.length ? `Chung so thich: ${interests.slice(0, 2).join(", ")}` : "",
    styles.length ? `Cung gu cafe: ${styles.slice(0, 2).join(", ")}` : "",
    goals.length ? `Cung muc tieu: ${goals.slice(0, 2).join(", ")}` : "",
    me.major && me.major === candidate.major ? "Cung nganh/lien quan" : ""
  ].filter(Boolean);
  return { score: Math.min(100, Math.round(score)), reasons, commonTags: interests, commonCafeStyles: styles };
}

export async function getDiscoveryFeed(userId: string) {
  const me = await User.findById(userId);
  if (!me) throw new Error("User not found");
  const swiped = await Swipe.find({ fromUser: userId }).distinct("toUser");
  const blockers = await User.find({ blockedUsers: userId }).distinct("_id");
  const excluded = [new mongoose.Types.ObjectId(userId), ...swiped, ...(me.blockedUsers ?? []), ...blockers];
  const prefs = me.onboarding?.preferences;
  const query: any = { _id: { $nin: excluded }, role: "user", status: "active", onboardingCompleted: true, isActive: true };
  if (prefs?.ageRange) query.age = { $gte: prefs.ageRange.min, $lte: prefs.ageRange.max };
  if (me.location?.coordinates?.[0]) {
    query.location = { $geoWithin: { $centerSphere: [me.location.coordinates, kmToRadians(prefs?.maxDistanceKm ?? 10)] } };
  }
  const users = await User.find(query).limit(50).lean();
  return users
    .filter((candidate) => genderAllowed(prefs?.preferredGender, me.gender, candidate.gender))
    .filter((candidate) => genderAllowed(candidate.onboarding?.preferences?.preferredGender, candidate.gender, me.gender))
    .map((candidate) => ({ ...candidate, matchMeta: scoreUsers(me, candidate) }))
    .sort((a, b) => b.matchMeta.score - a.matchMeta.score)
    .slice(0, 10);
}

export async function swipe(userId: string, targetUserId: string, action: "like" | "pass") {
  await Swipe.findOneAndUpdate({ fromUser: userId, toUser: targetUserId }, { action }, { upsert: true, new: true });
  if (action === "pass") return { matched: false };
  const reciprocal = await Swipe.findOne({ fromUser: targetUserId, toUser: userId, action: "like" });
  if (!reciprocal) return { matched: false };
  let match = await Match.findOne({ users: { $all: [userId, targetUserId] } });
  if (!match) {
    const me = await User.findById(userId);
    const target = await User.findById(targetUserId);
    const meta = scoreUsers(me, target);
    match = await Match.create({
      users: [userId, targetUserId],
      status: "matched",
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
      score: meta.score,
      reasons: meta.reasons
    });
  }
  return { matched: true, match };
}
