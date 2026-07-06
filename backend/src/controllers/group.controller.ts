import type { Request, Response } from "express";
import { Group } from "../models/Group.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** POST /api/groups — Create a new group */
export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, description, purpose, maxMembers } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Tên nhóm là bắt buộc." });
  const group = await Group.create({
    name: name.trim(),
    description: description?.trim(),
    creator: userId,
    members: [userId],
    purpose: purpose ?? "cafe_chat",
    maxMembers: maxMembers ?? 6
  });
  res.status(201).json({ group });
});

/** GET /api/groups — List groups I belong to */
export const getMyGroups = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const groups = await Group.find({ members: userId, status: "active" })
    .populate("creator", "displayName avatarUrl")
    .populate("members", "displayName avatarUrl age school major")
    .sort({ updatedAt: -1 });
  res.json({ groups });
});

/** GET /api/groups/:id — Get group detail */
export const getGroupDetail = asyncHandler(async (req: Request, res: Response) => {
  const group = await Group.findById(req.params.id)
    .populate("creator", "displayName avatarUrl")
    .populate("members", "displayName avatarUrl age school major gender onboarding");
  if (!group) return res.status(404).json({ message: "Nhóm không tồn tại." });
  res.json({ group });
});

/** POST /api/groups/:id/members — Add a member by email */
export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Nhóm không tồn tại." });
  if (String(group.creator) !== req.user!.id) return res.status(403).json({ message: "Chỉ trưởng nhóm mới có thể thêm thành viên." });
  if (group.status === "dissolved") return res.status(400).json({ message: "Nhóm đã giải tán." });
  if (group.members.length >= (group.maxMembers ?? 6)) return res.status(400).json({ message: "Nhóm đã đầy." });

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email thành viên là bắt buộc." });
  const target = await User.findOne({ email: email.toLowerCase().trim(), status: "active" });
  if (!target) return res.status(404).json({ message: "Không tìm thấy người dùng với email này." });
  if (group.members.map(String).includes(String(target._id))) return res.status(400).json({ message: "Người dùng đã trong nhóm." });

  group.members.push(target._id);
  await group.save();
  const updated = await Group.findById(group._id)
    .populate("creator", "displayName avatarUrl")
    .populate("members", "displayName avatarUrl age school major");
  res.json({ group: updated });
});

/** DELETE /api/groups/:id/members/:userId — Remove a member or leave the group */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Nhóm không tồn tại." });
  if (group.status === "dissolved") return res.status(400).json({ message: "Nhóm đã giải tán." });

  const targetUserId = req.params.userId;
  const isCreator = String(group.creator) === req.user!.id;
  const isSelf = targetUserId === req.user!.id;

  if (!isCreator && !isSelf) return res.status(403).json({ message: "Không có quyền xóa thành viên này." });
  if (isCreator && isSelf) return res.status(400).json({ message: "Trưởng nhóm không thể rời nhóm. Hãy giải tán nhóm nếu muốn." });

  group.members = group.members.filter((m) => String(m) !== targetUserId) as any;
  await group.save();
  res.json({ message: "Đã xóa thành viên.", group });
});

/** POST /api/groups/:id/dissolve — Dissolve the group */
export const dissolveGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Nhóm không tồn tại." });
  if (String(group.creator) !== req.user!.id) return res.status(403).json({ message: "Chỉ trưởng nhóm mới có thể giải tán." });

  group.status = "dissolved";
  await group.save();
  res.json({ message: "Nhóm đã được giải tán.", group });
});
