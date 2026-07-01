import { getDiscoveryFeed, swipe } from "../services/matching.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const feedController = asyncHandler(async (req, res) => {
    const users = await getDiscoveryFeed(req.user.id);
    res.json({ users });
});
export const likeController = asyncHandler(async (req, res) => {
    const result = await swipe(req.user.id, req.body.targetUserId, "like");
    res.json(result);
});
export const passController = asyncHandler(async (req, res) => {
    const result = await swipe(req.user.id, req.body.targetUserId, "pass");
    res.json(result);
});
