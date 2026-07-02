import mongoose from "mongoose";
import { Match } from "../models/Match.js";
import { Notification } from "../models/Notification.js";
import { Swipe } from "../models/Swipe.js";
import { User } from "../models/User.js";

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

function serviceError(message: string, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function hasUsableLocation(user: any) {
  const coords = user.location?.coordinates ?? [];
  const hasCoords = Number.isFinite(coords[0]) && Number.isFinite(coords[1]) && !(coords[0] === 0 && coords[1] === 0);
  return hasCoords && (user.location?.source === "gps" || user.location?.source === "manual" || Boolean(user.location?.addressLabel));
}

export function scoreUsers(me: any, candidate: any) {
  const interests = overlap(me.onboarding?.interests, candidate.onboarding?.interests);
  const styles = overlap(me.onboarding?.cafeStyles, candidate.onboarding?.cafeStyles);
  const goals = overlap(me.onboarding?.goals, candidate.onboarding?.goals);
  const times = overlap(me.onboarding?.preferredTimes, candidate.onboarding?.preferredTimes);
  let score = 0;
  score += Math.min(25, styles.length * 9);
  score += hasUsableLocation(me) && hasUsableLocation(candidate) ? 20 : 8;
  score += Math.max(0, 15 - Math.abs((me.age ?? 25) - (candidate.age ?? 25)) * 2);
  score += Math.min(10, goals.length * 5);
  if (me.major && candidate.major && me.major === candidate.major) score += 10;
  score += Math.min(10, interests.length * 4);
  score += Math.min(5, times.length * 3);
  if (candidate.lastSeenAt && Date.now() - new Date(candidate.lastSeenAt).getTime() < 7 * 24 * 3600 * 1000) score += 5;
  const reasons = [
    interests.length ? `Chung sở thích: ${interests.slice(0, 2).join(", ")}` : "",
    styles.length ? `Cùng gu cafe: ${styles.slice(0, 2).join(", ")}` : "",
    goals.length ? `Cùng mục tiêu: ${goals.slice(0, 2).join(", ")}` : "",
    me.major && me.major === candidate.major ? "Cùng ngành hoặc lĩnh vực liên quan" : ""
  ].filter(Boolean);
  return { score: Math.min(100, Math.round(score)), reasons, commonTags: interests, commonCafeStyles: styles };
}

export async function getDiscoveryFeed(userId: string) {
  const me = await User.findById(userId);
  if (!me) throw new Error("User not found");
  if (!hasUsableLocation(me)) return [];
  const swiped = await Swipe.find({ fromUser: userId }).distinct("toUser");
  const blockers = await User.find({ blockedUsers: userId }).distinct("_id");
  const excluded = [new mongoose.Types.ObjectId(userId), ...swiped, ...(me.blockedUsers ?? []), ...blockers];
  const prefs = me.onboarding?.preferences;
  const query: any = {
    _id: { $nin: excluded },
    role: "user",
    status: "active",
    onboardingCompleted: true,
    isActive: true,
    "location.coordinates.0": { $ne: 0 },
    "location.coordinates.1": { $ne: 0 }
  };
  if (prefs?.ageRange) query.age = { $gte: prefs.ageRange.min, $lte: prefs.ageRange.max };
  let users: any[] = [];
  if (hasUsableLocation(me)) {
    const coordinates = me.location?.coordinates;
    if (coordinates) {
      users = await User.find({
        ...query,
        location: { $geoWithin: { $centerSphere: [coordinates, kmToRadians(prefs?.maxDistanceKm ?? 10)] } }
      }).limit(50).lean();
    }
  }
  if (!users.length) users = await User.find(query).limit(50).lean();
  return users
    .filter((candidate) => hasUsableLocation(candidate))
    .filter((candidate) => genderAllowed(prefs?.preferredGender, me.gender, candidate.gender))
    .filter((candidate) => genderAllowed(candidate.onboarding?.preferences?.preferredGender, candidate.gender, me.gender))
    .map((candidate) => ({ ...candidate, matchMeta: scoreUsers(me, candidate) }))
    .sort((a, b) => b.matchMeta.score - a.matchMeta.score)
    .slice(0, 10);
}

export async function swipe(userId: string, targetUserId: string, action: "like" | "pass") {
  const [me, target] = await Promise.all([User.findById(userId), User.findById(targetUserId)]);
  if (!me || !target) throw serviceError("User not found", 404);
  if (!hasUsableLocation(me) || !hasUsableLocation(target)) {
    throw serviceError("Cần bật GPS hoặc chọn khu vực trước khi match.", 422);
  }
  await Swipe.findOneAndUpdate({ fromUser: userId, toUser: targetUserId }, { action }, { upsert: true, new: true });
  if (action === "pass") return { matched: false };
  const reciprocal = await Swipe.findOne({ fromUser: targetUserId, toUser: userId, action: "like" });
  if (!reciprocal) {
    const notification = await Notification.create({
      user: targetUserId,
      type: "incoming_like",
      title: "Có người muốn match với bạn",
      body: `${me.displayName ?? "Một người dùng"} đã like hồ sơ của bạn.`,
      data: {
        actorId: String(me._id),
        actor: {
          _id: String(me._id),
          displayName: me.displayName,
          avatarUrl: me.avatarUrl,
          profilePhotos: me.profilePhotos,
          age: me.age,
          gender: me.gender,
          zodiac: me.zodiac,
          school: me.school,
          major: me.major,
          location: me.location,
          onboarding: me.onboarding
        }
      }
    });
    return { matched: false, liked: true, notification };
  }
  let match = await Match.findOne({ users: { $all: [userId, targetUserId] } });
  if (!match) {
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

export async function getIncomingLikes(userId: string) {
  const me = await User.findById(userId);
  if (!me || !hasUsableLocation(me)) return [];
  const likedMe = await Swipe.find({ toUser: userId, action: "like" }).distinct("fromUser");
  const responded = await Swipe.find({ fromUser: userId, toUser: { $in: likedMe } }).distinct("toUser");
  const respondedSet = new Set(responded.map(String));
  const candidates = await User.find({
    _id: { $in: likedMe.filter((id) => !respondedSet.has(String(id))) },
    status: "active",
    isActive: true,
    onboardingCompleted: true,
    "location.coordinates.0": { $ne: 0 },
    "location.coordinates.1": { $ne: 0 }
  }).lean();
  return candidates.filter(hasUsableLocation).map((candidate) => ({ ...candidate, matchMeta: scoreUsers(me, candidate) }));
}
