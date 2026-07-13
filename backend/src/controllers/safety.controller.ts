import type { Request, Response } from "express";
import { ChatRoom } from "../models/ChatRoom.js";
import { Match } from "../models/Match.js";
import { Report } from "../models/Report.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportUser = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.create({
    reporter: req.user!.id,
    reportedUser: req.body.reportedUser,
    match: req.body.match,
    message: req.body.message,
    reason: req.body.reason,
    details: req.body.details
  });

  const uniqueReporters = await Report.distinct("reporter", { reportedUser: req.body.reportedUser });
  if (uniqueReporters.length >= 3) {
    await Report.updateMany({ reportedUser: req.body.reportedUser, status: { $in: ["new", "reviewing"] } }, { priority: true });
    report.priority = true;
    await report.save();
  }

  res.status(201).json({ report });
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user!.id, { $addToSet: { blockedUsers: req.body.targetUserId } });
  const matches = await Match.find({ users: { $all: [req.user!.id, req.body.targetUserId] } });
  const matchIds = matches.map((match) => match._id);
  await Match.updateMany({ _id: { $in: matchIds } }, { status: "blocked" });
  await ChatRoom.updateMany({ match: { $in: matchIds } }, { status: "blocked" });
  res.json({ message: "User blocked" });
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user!.id;
  const targetUserId = req.body.targetUserId;
  await User.findByIdAndUpdate(currentUserId, { $pull: { blockedUsers: targetUserId } });

  const target = await User.findById(targetUserId).select("blockedUsers");
  const targetStillBlocksMe = (target?.blockedUsers ?? []).map(String).includes(currentUserId);
  const matches = await Match.find({ users: { $all: [currentUserId, targetUserId] } });
  const matchIds = matches.map((match) => match._id);

  if (!targetStillBlocksMe && matchIds.length) {
    await Match.updateMany({ _id: { $in: matchIds }, status: "blocked" }, { status: "chat_opened" });
    await ChatRoom.updateMany({ match: { $in: matchIds }, status: "blocked" }, { status: "active" });
  }

  res.json({ message: targetStillBlocksMe ? "Đã bỏ chặn, nhưng người kia vẫn đang chặn bạn." : "Đã bỏ chặn người dùng." });
});
