import type { Request, Response } from "express";
import type { Server } from "socket.io";
import { Group } from "../models/Group.js";
import { GroupMessage } from "../models/GroupMessage.js";
import { createAndEmitNotification } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getGroupMessages = asyncHandler(async (req: Request, res: Response) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Nhóm không tồn tại." });
  if (group.status === "dissolved") return res.status(403).json({ message: "Nhóm đã giải tán." });
  
  if (!group.members.map(String).includes(req.user!.id)) {
    return res.status(403).json({ message: "Bạn không phải thành viên nhóm này." });
  }

  const messages = await GroupMessage.find({ group: group._id })
    .sort({ createdAt: 1 })
    .limit(100)
    .populate("sender", "displayName avatarUrl");

  const normalizedMessages = messages.map((message: any) => {
    const plain = message.toObject();
    const senderId = String(message.sender?._id ?? message.sender);
    return { ...plain, senderId, mine: senderId === req.user!.id };
  });

  res.json({ messages: normalizedMessages, currentUserId: req.user!.id });
});

export const sendGroupMessage = asyncHandler(async (req: Request, res: Response) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Nhóm không tồn tại." });
  if (group.status === "dissolved") return res.status(403).json({ message: "Nhóm đã giải tán." });
  
  if (!group.members.map(String).includes(req.user!.id)) {
    return res.status(403).json({ message: "Bạn không phải thành viên nhóm này." });
  }

  if (!req.body.text?.trim() && !req.body.fileUrl) return res.status(400).json({ message: "Tin nhắn không được để trống" });

  const message = await GroupMessage.create({
    group: group._id,
    sender: req.user!.id,
    text: req.body.text || "",
    type: req.body.type || "text",
    fileUrl: req.body.fileUrl,
    fileName: req.body.fileName,
    readBy: [req.user!.id]
  });

  await message.populate("sender", "displayName avatarUrl");
  const plain = message.toObject() as any;
  const outgoing = { ...plain, senderId: req.user!.id };

  const io = req.app.get("io") as Server | undefined;
  io?.to(`group:${group._id}`).emit("new_group_message", outgoing);

  // Group notification can be noisy, so we might want to batch or limit it.
  // For now, let's keep it simple and notify all other members.
  const recipients = group.members.map(String).filter((userId) => userId !== req.user!.id);
  await Promise.all(
    recipients.map((userId) =>
      createAndEmitNotification(io, {
        userId,
        type: "group_message",
        title: `Tin nhắn mới từ nhóm ${group.name}`,
        body: req.body.text.slice(0, 120),
        data: { groupId: String(group._id) }
      })
    )
  );

  res.status(201).json({ message: { ...outgoing, mine: true } });
});
