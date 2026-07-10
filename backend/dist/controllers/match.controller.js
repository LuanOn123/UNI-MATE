import { CafeProposal } from "../models/CafeProposal.js";
import { ChatRoom } from "../models/ChatRoom.js";
import { Match } from "../models/Match.js";
import { PlaceCache } from "../models/PlaceCache.js";
import { User } from "../models/User.js";
import { createAndEmitNotification, emitMatchUpdated } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { suggestCafePlaces } from "../services/places.service.js";
async function expireMatchIfNeeded(match) {
    if (match?.expiresAt && new Date(match.expiresAt).getTime() < Date.now() && !["cafe_confirmed", "chat_opened", "blocked"].includes(match.status)) {
        match.status = "expired";
        await CafeProposal.updateMany({ match: match._id, status: "active" }, { status: "expired" });
        await match.save();
    }
    return match;
}
async function openChatForMatch(match) {
    if (!match || ["expired", "blocked", "cancelled"].includes(match.status))
        return match;
    const users = (match.users ?? []).map((user) => user?._id ?? user);
    const room = await ChatRoom.findOneAndUpdate({ match: match._id }, { match: match._id, users, status: "active" }, { upsert: true, new: true, setDefaultsOnInsert: true });
    match.chatRoom = room._id;
    match.status = "chat_opened";
    await match.save();
    return match;
}
function matchUserIds(match) {
    return (match.users ?? []).map(String);
}
function otherUserId(match, currentUserId) {
    return matchUserIds(match).find((userId) => userId !== currentUserId);
}
export const listMatches = asyncHandler(async (req, res) => {
    const matches = await Match.find({ users: req.user.id }).populate("users selectedPlace chatRoom").sort({ updatedAt: -1 });
    await Promise.all(matches.map(async (match) => openChatForMatch(await expireMatchIfNeeded(match))));
    await Promise.all(matches.map((match) => match.populate("users selectedPlace chatRoom")));
    res.json({ matches });
});
export const getMatch = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user.id }).populate("users selectedPlace chatRoom");
    if (!match)
        return res.status(404).json({ message: "Match not found" });
    await openChatForMatch(await expireMatchIfNeeded(match));
    await match.populate("users selectedPlace chatRoom");
    const proposals = await CafeProposal.find({ match: match._id }).populate("cafe proposedBy").sort({ createdAt: -1 });
    res.json({ match, proposals });
});
export const placeSuggestions = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user.id });
    if (!match)
        return res.status(404).json({ message: "Match not found" });
    await expireMatchIfNeeded(match);
    if (match.status === "expired")
        return res.status(410).json({ message: "Match expired" });
    const places = await suggestCafePlaces(match.users.map(String));
    res.json({ places });
});
export const selectPlace = asyncHandler(async (req, res) => {
    const place = await PlaceCache.findOne({ _id: req.body.placeId, status: "active" });
    if (!place)
        return res.status(404).json({ message: "Active cafe not found" });
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user.id });
    if (!match)
        return res.status(404).json({ message: "Match not found" });
    await expireMatchIfNeeded(match);
    if (match.status === "expired")
        return res.status(410).json({ message: "Match expired" });
    await CafeProposal.updateMany({ match: match._id, status: "active" }, { status: "replaced" });
    await CafeProposal.create({ match: match._id, proposedBy: req.user.id, cafe: place._id, status: "active" });
    match.selectedPlace = place._id;
    match.selectedBy = req.user.id;
    match.confirmedBy = [req.user.id];
    match.status = "cafe_proposed";
    await match.save();
    await match.populate("selectedPlace chatRoom");
    const io = req.app.get("io");
    const recipientId = otherUserId(match, req.user.id);
    if (recipientId) {
        const actor = await User.findById(req.user.id).select("displayName");
        await createAndEmitNotification(io, {
            userId: recipientId,
            type: "cafe_proposal",
            title: "Có quán đang chờ bạn chốt",
            body: `${actor?.displayName ?? "Người kia"} đề xuất ${place.name}.`
        });
    }
    emitMatchUpdated(io, matchUserIds(match), { matchId: String(match._id), status: match.status, selectedPlace: match.selectedPlace });
    res.json({ match });
});
export const confirmPlace = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user.id });
    if (!match?.selectedPlace)
        return res.status(404).json({ message: "No selected cafe" });
    await expireMatchIfNeeded(match);
    if (match.status === "expired")
        return res.status(410).json({ message: "Match expired" });
    if (String(match.selectedBy) === req.user.id)
        return res.status(400).json({ message: "Waiting for the other user to accept" });
    const updatedMatch = await Match.findOneAndUpdate({ _id: match._id }, { $addToSet: { confirmedBy: req.user.id } }, { new: true });
    if (!updatedMatch)
        return res.status(404).json({ message: "Match not found" });
    if (updatedMatch.confirmedBy.length >= 2 && updatedMatch.status !== "chat_opened") {
        updatedMatch.status = "chat_opened";
        await CafeProposal.findOneAndUpdate({ match: match._id, status: "active" }, { status: "accepted" });
        const room = await ChatRoom.findOneAndUpdate({ match: match._id }, { match: match._id, users: match.users, place: match.selectedPlace, status: "active" }, { upsert: true, new: true });
        updatedMatch.chatRoom = room._id;
    }
    await updatedMatch.save();
    await updatedMatch.populate("selectedPlace chatRoom");
    const io = req.app.get("io");
    emitMatchUpdated(io, matchUserIds(updatedMatch), { matchId: String(updatedMatch._id), status: updatedMatch.status, chatRoom: updatedMatch.chatRoom });
    res.json({ match: updatedMatch });
});
export const rejectPlace = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user.id });
    if (!match?.selectedPlace)
        return res.status(404).json({ message: "No selected cafe" });
    await expireMatchIfNeeded(match);
    if (match.status === "expired")
        return res.status(410).json({ message: "Match expired" });
    if (match.status === "chat_opened")
        return res.status(400).json({ message: "Chat already opened" });
    if (String(match.selectedBy) === req.user.id)
        return res.status(400).json({ message: "You cannot reject your own proposal" });
    const proposerId = String(match.selectedBy);
    await CafeProposal.findOneAndUpdate({ match: match._id, status: "active" }, { status: "rejected" });
    match.selectedPlace = undefined;
    match.selectedBy = undefined;
    match.confirmedBy = [];
    match.status = "matched";
    await match.save();
    await match.populate("selectedPlace chatRoom");
    const io = req.app.get("io");
    const actor = await User.findById(req.user.id).select("displayName");
    await createAndEmitNotification(io, {
        userId: proposerId,
        type: "cafe_rejected",
        title: "Quán đã bị từ chối",
        body: `${actor?.displayName ?? "Người kia"} muốn bạn chọn quán khác.`
    });
    emitMatchUpdated(io, matchUserIds(match), { matchId: String(match._id), status: match.status });
    res.json({ match });
});
export const cancelMatch = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user.id });
    if (!match)
        return res.status(404).json({ message: "Match not found" });
    if (["cancelled", "blocked"].includes(match.status))
        return res.json({ match });
    match.status = "cancelled";
    await CafeProposal.updateMany({ match: match._id, status: "active" }, { status: "rejected" });
    if (match.chatRoom)
        await ChatRoom.findByIdAndUpdate(match.chatRoom, { status: "archived" });
    await match.save();
    await match.populate("selectedPlace chatRoom");
    const io = req.app.get("io");
    const recipientId = otherUserId(match, req.user.id);
    if (recipientId) {
        const actor = await User.findById(req.user.id).select("displayName");
        await createAndEmitNotification(io, {
            userId: recipientId,
            type: "match_cancelled",
            title: "Match đã bị hủy",
            body: `${actor?.displayName ?? "Người kia"} đã từ chối tiếp tục match.`
        });
    }
    emitMatchUpdated(io, matchUserIds(match), { matchId: String(match._id), status: match.status });
    res.json({ match });
});
