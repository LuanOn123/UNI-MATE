import mongoose from "mongoose";
import { Match } from "../models/Match.js";
import { Notification } from "../models/Notification.js";
import { Swipe } from "../models/Swipe.js";
import { User } from "../models/User.js";
const kmToRadians = (km) => km / 6378.1;
function overlap(a = [], b = []) {
    return a.filter((x) => b.includes(x));
}
function genderAllowed(preferredGender, actorGender, targetGender) {
    if (!preferredGender || preferredGender === "all")
        return true;
    if (preferredGender === "same")
        return actorGender === targetGender;
    if (preferredGender === "opposite")
        return actorGender !== targetGender;
    return true;
}
function serviceError(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}
function hasUsableLocation(user) {
    const coords = user.location?.coordinates ?? [];
    const hasCoords = Number.isFinite(coords[0]) && Number.isFinite(coords[1]) && !(coords[0] === 0 && coords[1] === 0);
    return hasCoords && (user.location?.source === "gps" || user.location?.source === "manual" || Boolean(user.location?.addressLabel));
}
/** Haversine distance in km between two [lng, lat] coordinate pairs */
function haversineKm(coordsA, coordsB) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const [lngA, latA] = coordsA;
    const [lngB, latB] = coordsB;
    const dLat = toRad(latB - latA);
    const dLng = toRad(lngB - lngA);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
/**
 * Score a candidate against the current user.
 *
 * Scoring weights (total ~100):
 *   - Distance proximity:      0–25  (closer = more points, weighted highest)
 *   - Cafe style overlap:      0–20
 *   - Interest/vibe overlap:   0–15
 *   - Goal overlap:            0–10
 *   - Major match/preference:  0–10
 *   - Vibe space match:         0–5
 *   - Age proximity:            0–10
 *   - Active recency bonus:       5
 */
export function scoreUsers(me, candidate) {
    const interests = overlap(me.onboarding?.interests, candidate.onboarding?.interests);
    const styles = overlap(me.onboarding?.cafeStyles, candidate.onboarding?.cafeStyles);
    const goals = overlap(me.onboarding?.goals, candidate.onboarding?.goals);
    const times = overlap(me.onboarding?.preferredTimes, candidate.onboarding?.preferredTimes);
    let score = 0;
    // --- Distance score (0-25): Closer = higher score ---
    if (hasUsableLocation(me) && hasUsableLocation(candidate)) {
        const dist = haversineKm(me.location.coordinates, candidate.location.coordinates);
        // 0km → 25pts, 5km → 18pts, 10km → 12pts, 20km → 0pts
        score += Math.max(0, Math.round(25 * (1 - dist / 20)));
    }
    else {
        score += 5; // fallback if no location
    }
    // --- Cafe style overlap (0-20) ---
    score += Math.min(20, styles.length * 7);
    // --- Interest/vibe tag overlap (0-15) ---
    score += Math.min(15, interests.length * 5);
    // --- Goal overlap (0-10) ---
    score += Math.min(10, goals.length * 5);
    // --- Major match & preference (0-10) ---
    const myMajorPref = me.onboarding?.majorPreference;
    const sameMajor = me.major && candidate.major && me.major === candidate.major;
    const diffMajor = me.major && candidate.major && me.major !== candidate.major;
    if (myMajorPref === "same" && sameMajor)
        score += 10;
    else if (myMajorPref === "different" && diffMajor)
        score += 10;
    else if (myMajorPref === "any" && (sameMajor || diffMajor))
        score += 5;
    else if (!myMajorPref && sameMajor)
        score += 8; // legacy fallback
    // --- Vibe space match (0-5) ---
    if (me.onboarding?.vibePreference && me.onboarding.vibePreference === candidate.onboarding?.vibePreference) {
        score += 5;
    }
    // --- Age proximity (0-10) ---
    score += Math.max(0, 10 - Math.abs((me.age ?? 25) - (candidate.age ?? 25)) * 2);
    // --- Active recency bonus (0-5) ---
    if (candidate.lastSeenAt && Date.now() - new Date(candidate.lastSeenAt).getTime() < 7 * 24 * 3600 * 1000)
        score += 5;
    // --- Time overlap small bonus ---
    score += Math.min(5, times.length * 2);
    const reasons = [
        interests.length ? `Chung sở thích: ${interests.slice(0, 2).join(", ")}` : "",
        styles.length ? `Cùng gu cafe: ${styles.slice(0, 2).join(", ")}` : "",
        goals.length ? `Cùng mục tiêu: ${goals.slice(0, 2).join(", ")}` : "",
        sameMajor ? "Cùng ngành hoặc lĩnh vực liên quan" : "",
        me.onboarding?.vibePreference && me.onboarding.vibePreference === candidate.onboarding?.vibePreference ? "Cùng vibe không gian" : ""
    ].filter(Boolean);
    return { score: Math.min(100, Math.round(score)), reasons, commonTags: interests, commonCafeStyles: styles };
}
export async function getDiscoveryFeed(userId) {
    const me = await User.findById(userId);
    if (!me)
        throw new Error("User not found");
    if (!hasUsableLocation(me))
        return [];
    const swiped = await Swipe.find({ fromUser: userId }).distinct("toUser");
    const blockers = await User.find({ blockedUsers: userId }).distinct("_id");
    const excluded = [new mongoose.Types.ObjectId(userId), ...swiped, ...(me.blockedUsers ?? []), ...blockers];
    const prefs = me.onboarding?.preferences;
    const query = {
        _id: { $nin: excluded },
        role: "user",
        status: "active",
        onboardingCompleted: true,
        isActive: true,
        "location.coordinates.0": { $ne: 0 },
        "location.coordinates.1": { $ne: 0 }
    };
    if (prefs?.ageRange)
        query.age = { $gte: prefs.ageRange.min, $lte: prefs.ageRange.max };
    // --- Hard Filter: Purpose must match ---
    const myPurpose = me.onboarding?.purpose;
    if (myPurpose) {
        query["onboarding.purpose"] = myPurpose;
    }
    let users = [];
    if (hasUsableLocation(me)) {
        const coordinates = me.location?.coordinates;
        if (coordinates) {
            users = await User.find({
                ...query,
                location: { $geoWithin: { $centerSphere: [coordinates, kmToRadians(prefs?.maxDistanceKm ?? 10)] } }
            }).limit(50).lean();
        }
    }
    if (!users.length)
        users = await User.find(query).limit(50).lean();
    return users
        .filter((candidate) => hasUsableLocation(candidate))
        .filter((candidate) => genderAllowed(prefs?.preferredGender, me.gender, candidate.gender))
        .filter((candidate) => genderAllowed(candidate.onboarding?.preferences?.preferredGender, candidate.gender, me.gender))
        .map((candidate) => ({ ...candidate, matchMeta: scoreUsers(me, candidate) }))
        .sort((a, b) => b.matchMeta.score - a.matchMeta.score)
        .slice(0, 10);
}
export async function swipe(userId, targetUserId, action) {
    const [me, target] = await Promise.all([User.findById(userId), User.findById(targetUserId)]);
    if (!me || !target)
        throw serviceError("User not found", 404);
    if (!hasUsableLocation(me) || !hasUsableLocation(target)) {
        throw serviceError("Cần bật GPS hoặc chọn khu vực trước khi match.", 422);
    }
    await Swipe.findOneAndUpdate({ fromUser: userId, toUser: targetUserId }, { action }, { upsert: true, new: true });
    if (action === "pass")
        return { matched: false };
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
export async function getIncomingLikes(userId) {
    const me = await User.findById(userId);
    if (!me || !hasUsableLocation(me))
        return [];
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
