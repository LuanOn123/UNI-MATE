import type { Request, Response } from "express";
import type { Server } from "socket.io";
import { getDiscoveryFeed, getIncomingLikes, swipe } from "../services/matching.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const feedController = asyncHandler(async (req: Request, res: Response) => {
  const users = await getDiscoveryFeed(req.user!.id);
  res.json({ users });
});

export const incomingLikesController = asyncHandler(async (req: Request, res: Response) => {
  const users = await getIncomingLikes(req.user!.id);
  res.json({ users });
});

export const likeController = asyncHandler(async (req: Request, res: Response) => {
  const result = await swipe(req.user!.id, req.body.targetUserId, "like");
  if ("notification" in result && result.notification) {
    const io = req.app.get("io") as Server | undefined;
    io?.to(`user:${req.body.targetUserId}`).emit("notification:new", result.notification.toObject?.() ?? result.notification);
  }
  res.json(result);
});

export const passController = asyncHandler(async (req: Request, res: Response) => {
  const result = await swipe(req.user!.id, req.body.targetUserId, "pass");
  res.json(result);
});
