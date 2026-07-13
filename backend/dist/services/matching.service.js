import mongoose from "mongoose";
import { ChatRoom } from "../models/ChatRoom.js";
import { env } from "../config/env.js";
import { Match } from "../models/Match.js";
import { Notification } from "../models/Notification.js";
import { Swipe } from "../models/Swipe.js";
import { User } from "../models/User.js";
import { calculateDistanceScore, calculateRDR, calibrateUrbanDurationSeconds, haversineMeters } from "./distanceMatching.service.js";
import { computeOsrmTable } from "./osrm.service.js";
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
function selectedPriorities(user) {
    const priorities = Array.isArray(user.onboarding?.preferences?.priorities) ? user.onboarding.preferences.priorities : [];
    return new Set(priorities.filter((priority) => priority === "nearby" || priority === "same_interest"));
}
function hasUsableLocation(user) {
    const coords = user.location?.coordinates ?? [];
    const hasCoords = Number.isFinite(coords[0]) && Number.isFinite(coords[1]) && !(coords[0] === 0 && coords[1] === 0);
    return hasCoords && (user.location?.source === "gps" || user.location?.source === "manual" || Boolean(user.location?.addressLabel));
}
function coordsOf(user) {
    const coords = user.location?.coordinates;
    if (!Array.isArray(coords) || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1]))
        return undefined;
    return coords;
}
async function buildRouteDistanceMeta(me, candidates) {
    const origin = coordsOf(me);
    const destinations = candidates.map(coordsOf);
    const metaByUserId = new Map();
    if (!origin || destinations.some((coords) => !coords))
        return metaByUserId;
    try {
        const routes = await computeOsrmTable(origin, destinations);
        const routeByDestination = new Map(routes.map((route) => [route.destinationIndex, route]));
        candidates.forEach((candidate, index) => {
            const route = routeByDestination.get(index);
            const destination = destinations[index];
            const calibratedDurationSeconds = calibrateUrbanDurationSeconds(route?.durationSeconds, route?.distanceMeters, env.DISTANCE_CITY_SPEED_KMH);
            const durationSeconds = calibratedDurationSeconds ?? null;
            const distanceMeters = route?.distanceMeters ?? null;
            const durationMinutes = durationSeconds === null ? null : Number((durationSeconds / 60).toFixed(1));
            const distanceScore = calculateDistanceScore(calibratedDurationSeconds, env.DISTANCE_T50_MINUTES, env.DISTANCE_TMAX_MINUTES);
            const straightLineMeters = haversineMeters(origin, destination);
            const rdr = calculateRDR(route?.distanceMeters, straightLineMeters);
            metaByUserId.set(String(candidate._id), {
                distanceMeters,
                durationSeconds,
                durationMinutes,
                distanceScore,
                rdr,
                barrierSensitive: rdr !== null && rdr >= env.DISTANCE_RDR_THRESHOLD
            });
        });
    }
    catch (error) {
        console.error("OSRM distance scoring failed; distance score will be 0", error);
    }
    return metaByUserId;
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
export function scoreUsers(me, candidate, routeDistance) {
    const interests = overlap(me.onboarding?.interests, candidate.onboarding?.interests);
    const styles = overlap(me.onboarding?.cafeStyles, candidate.onboarding?.cafeStyles);
    const goals = overlap(me.onboarding?.goals, candidate.onboarding?.goals);
    const times = overlap(me.onboarding?.preferredTimes, candidate.onboarding?.preferredTimes);
    const priorities = selectedPriorities(me);
    const distanceWeight = priorities.has("nearby") ? 0.25 : 0.15;
    const interestMaxScore = priorities.has("same_interest") ? 15 : 8;
    let score = 0;
    // --- Distance score (0-25): OSRM travel-time score, not bird-flight distance ---
    if (hasUsableLocation(me) && hasUsableLocation(candidate)) {
        score += Math.round((routeDistance?.distanceScore ?? 0) * distanceWeight);
    }
    // --- Cafe style overlap (0-20) ---
    score += Math.min(20, styles.length * 7);
    // --- Interest/vibe tag overlap (0-15) ---
    score += Math.min(interestMaxScore, interests.length * 5);
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
        routeDistance?.durationMinutes !== null && routeDistance?.durationMinutes !== undefined ? `Khoảng ${routeDistance.durationMinutes} phút di chuyển` : "",
        routeDistance?.barrierSensitive ? "Đường đi thật vòng xa hơn đường chim bay" : "",
        interests.length ? `Chung sở thích: ${interests.slice(0, 2).join(", ")}` : "",
        styles.length ? `Cùng gu cafe: ${styles.slice(0, 2).join(", ")}` : "",
        goals.length ? `Cùng mục tiêu: ${goals.slice(0, 2).join(", ")}` : "",
        sameMajor ? "Cùng ngành hoặc lĩnh vực liên quan" : "",
        me.onboarding?.vibePreference && me.onboarding.vibePreference === candidate.onboarding?.vibePreference ? "Cùng vibe không gian" : ""
    ].filter(Boolean);
    return {
        score: Math.min(100, Math.round(score)),
        reasons,
        commonTags: interests,
        commonCafeStyles: styles,
        distanceScore: routeDistance?.distanceScore ?? 0,
        distanceMeters: routeDistance?.distanceMeters ?? null,
        durationSeconds: routeDistance?.durationSeconds ?? null,
        durationMinutes: routeDistance?.durationMinutes ?? null,
        rdr: routeDistance?.rdr ?? null,
        barrierSensitive: routeDistance?.barrierSensitive ?? false
    };
}
async function scoreUsersWithDistance(me, candidate) {
    const metaByUserId = await buildRouteDistanceMeta(me, [candidate]);
    return scoreUsers(me, candidate, metaByUserId.get(String(candidate._id)));
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
    const prefilterKm = env.DISTANCE_R_PREFILTER_METERS / 1000;
    const searchRadiusKm = Math.min(prefs?.maxDistanceKm ?? prefilterKm, prefilterKm);
    const candidateLimit = env.DISTANCE_CANDIDATE_LIMIT;
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
    // --- Hard Filter: Purpose should overlap when candidate has purpose data.
    // Legacy/seeded profiles may miss onboarding.purpose, so keep them discoverable
    // and let scoring/ranking handle the weaker match instead of returning an empty feed.
    const myPurpose = me.onboarding?.purpose;
    if (myPurpose && Array.isArray(myPurpose) && myPurpose.length > 0) {
        query.$or = [
            { "onboarding.purpose": { $in: myPurpose } },
            { "onboarding.purpose": { $exists: false } },
            { "onboarding.purpose": { $size: 0 } }
        ];
    }
    let users = [];
    if (hasUsableLocation(me)) {
        const coordinates = me.location?.coordinates;
        if (coordinates) {
            users = await User.find({
                ...query,
                location: { $geoWithin: { $centerSphere: [coordinates, kmToRadians(searchRadiusKm)] } }
            }).limit(candidateLimit).lean();
        }
    }
    const filteredUsers = users
        .filter((candidate) => hasUsableLocation(candidate))
        .filter((candidate) => genderAllowed(prefs?.preferredGender, me.gender, candidate.gender))
        .filter((candidate) => genderAllowed(candidate.onboarding?.preferences?.preferredGender, candidate.gender, me.gender));
    const routeMetaByUserId = await buildRouteDistanceMeta(me, filteredUsers);
    return filteredUsers
        .map((candidate) => ({ ...candidate, matchMeta: scoreUsers(me, candidate, routeMetaByUserId.get(String(candidate._id))) }))
        .sort((a, b) => b.matchMeta.score - a.matchMeta.score || b.matchMeta.distanceScore - a.matchMeta.distanceScore)
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
        const meta = await scoreUsersWithDistance(me, target);
        match = await Match.create({
            users: [userId, targetUserId],
            status: "chat_opened",
            expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
            score: meta.score,
            reasons: meta.reasons
        });
        const room = await ChatRoom.create({
            match: match._id,
            users: [userId, targetUserId],
            status: "active"
        });
        match.chatRoom = room._id;
        await match.save();
    }
    const room = await ChatRoom.findOneAndUpdate({ match: match._id }, { match: match._id, users: match.users.map((matchUser) => matchUser?._id ?? matchUser), status: "active" }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (!match.chatRoom || match.status !== "chat_opened") {
        match.chatRoom = room._id;
        match.status = "chat_opened";
        await match.save();
    }
    await match.populate("chatRoom");
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
    const filteredCandidates = candidates.filter(hasUsableLocation);
    const routeMetaByUserId = await buildRouteDistanceMeta(me, filteredCandidates);
    return filteredCandidates.map((candidate) => ({ ...candidate, matchMeta: scoreUsers(me, candidate, routeMetaByUserId.get(String(candidate._id))) }));
}
