import { CafeProposal } from "../models/CafeProposal.js";
import { ChatRoom } from "../models/ChatRoom.js";
import { Match } from "../models/Match.js";
import { PlaceCache } from "../models/PlaceCache.js";
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
export const listMatches = asyncHandler(async (req, res) => {
    const matches = await Match.find({ users: req.user.id }).populate("users selectedPlace chatRoom").sort({ updatedAt: -1 });
    await Promise.all(matches.map(expireMatchIfNeeded));
    res.json({ matches });
});
export const getMatch = asyncHandler(async (req, res) => {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user.id }).populate("users selectedPlace chatRoom");
    if (!match)
        return res.status(404).json({ message: "Match not found" });
    await expireMatchIfNeeded(match);
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
    const confirmed = new Set(match.confirmedBy.map(String));
    confirmed.add(req.user.id);
    match.confirmedBy = [...confirmed];
    if (match.confirmedBy.length >= 2) {
        match.status = "chat_opened";
        await CafeProposal.findOneAndUpdate({ match: match._id, status: "active" }, { status: "accepted" });
        const room = await ChatRoom.findOneAndUpdate({ match: match._id }, { match: match._id, users: match.users, place: match.selectedPlace, status: "active" }, { upsert: true, new: true });
        match.chatRoom = room._id;
    }
    await match.save();
    await match.populate("selectedPlace chatRoom");
    res.json({ match });
});
