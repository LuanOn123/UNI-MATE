import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { Server } from "socket.io";
import { AdminAction } from "../models/AdminAction.js";
import { Match } from "../models/Match.js";
import { PlaceCache } from "../models/PlaceCache.js";
import { Report } from "../models/Report.js";
import { Tag } from "../models/Tag.js";
import { User } from "../models/User.js";
import { createAndEmitNotification } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function audit(req: Request, action: string, targetType: string, targetId: string, reason?: string) {
  await AdminAction.create({ admin: req.user!.id, action, targetType, targetId, reason });
}

function validateOpeningHours(value?: unknown) {
  if (value === undefined) return "";
  if (typeof value !== "string" || !value.trim()) return "Giờ mở cửa là bắt buộc.";
  if (value === "24/7") return "";
  const match = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return "Giờ mở cửa phải có định dạng HH:mm - HH:mm.";
  const open = Number(match[1]) * 60 + Number(match[2]);
  const close = Number(match[3]) * 60 + Number(match[4]);
  if (open >= close) return "Giờ đóng cửa phải sau giờ mở cửa.";
  return "";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [users, newUsers, matches, confirmed, reports, places] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } }),
    Match.countDocuments(),
    Match.countDocuments({ status: { $in: ["cafe_confirmed", "chat_opened"] } }),
    Report.countDocuments({ status: "new" }),
    PlaceCache.countDocuments({ status: "active" })
  ]);
  res.json({ stats: { users, newUsers, matches, confirmed, newReports: reports, activePlaces: places } });
});

export const adminUsers = asyncHandler(async (req: Request, res: Response) => {
  const query: any = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.role) query.role = req.query.role;
  if (req.query.q) query.$or = [{ email: new RegExp(String(req.query.q), "i") }, { displayName: new RegExp(String(req.query.q), "i") }];
  res.json({ users: await User.find(query).select("-refreshTokenHash -passwordHash").sort({ createdAt: -1 }).limit(100) });
});

export const adminUserDetail = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.userId).select("-refreshTokenHash -passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  const [matches, reports] = await Promise.all([
    Match.find({ users: user._id }).populate("selectedPlace chatRoom").sort({ createdAt: -1 }).limit(50),
    Report.find({ reportedUser: user._id }).populate("reporter match message").sort({ createdAt: -1 }).limit(50)
  ]);
  res.json({ user, matches, reports });
});

export const createAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, displayName, role, status, gender, birthDate, school, major } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const age = birthDate ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : undefined;

  const user = await User.create({
    email,
    passwordHash,
    displayName,
    role: role || "user",
    status: status || "active",
    isActive: status === "active" || !status,
    gender: gender || "prefer_not",
    birthDate: birthDate ? new Date(birthDate) : undefined,
    age,
    school,
    major,
    emailVerified: true,
    onboardingCompleted: true,
    disclaimerAccepted: true
  });

  await audit(req, "create_user", "user", String(user._id), `Admin created user ${email}`);

  res.status(201).json({ user });
});

export const updateAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, displayName, role, status, gender, birthDate, school, major, password } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already exists" });
    user.email = email;
  }

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  if (displayName !== undefined) user.displayName = displayName;
  if (role !== undefined) user.role = role;
  if (status !== undefined) {
    user.status = status;
    user.isActive = status === "active";
  }
  if (gender !== undefined) user.gender = gender;
  if (birthDate !== undefined) {
    user.birthDate = birthDate ? new Date(birthDate) : undefined;
    if (birthDate) {
      user.age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
    } else {
      user.age = undefined;
    }
  }
  if (school !== undefined) user.school = school;
  if (major !== undefined) user.major = major;

  await user.save();
  await audit(req, "update_user", "user", String(user._id), `Admin updated user details`);

  res.json({ user });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, reason } = req.body;
  if (!["active", "suspended", "banned"].includes(status)) return res.status(400).json({ message: "Invalid status" });
  const user = await User.findByIdAndUpdate(req.params.userId, { status, isActive: status === "active" }, { new: true }).select("-refreshTokenHash -passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  await audit(req, status === "active" ? "reactivate_user" : status, "user", req.params.userId, reason);
  res.json({ user });
});

export const adminReports = asyncHandler(async (req: Request, res: Response) => {
  const query: any = {};
  if (req.query.status) query.status = req.query.status;
  res.json({ reports: await Report.find(query).populate("reporter reportedUser match message").sort({ priority: -1, createdAt: -1 }).limit(100) });
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
  const { action, note, reason } = req.body;
  const report = await Report.findById(req.params.reportId);
  if (!report) return res.status(404).json({ message: "Report not found" });

  if (action === "dismiss") report.status = "dismissed";
  if (action === "review") report.status = "reviewing";
  if (action === "warn") report.status = "resolved_valid";
  if (action === "suspend" || action === "ban") {
    report.status = "resolved_valid";
    await User.findByIdAndUpdate(report.reportedUser, { status: action === "ban" ? "banned" : "suspended", isActive: false });
  }
  report.adminNote = note;
  await report.save();
  await audit(req, `report_${action}`, "report", req.params.reportId, reason ?? note);
  res.json({ report });
});

export const adminMatches = asyncHandler(async (req: Request, res: Response) => {
  const query: any = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.q) {
    const q = String(req.query.q).trim();
    const regex = new RegExp(escapeRegex(q), "i");
    const [users, places] = await Promise.all([
      User.find({ $or: [{ email: regex }, { displayName: regex }] }).select("_id"),
      PlaceCache.find({ $or: [{ name: regex }, { address: regex }] }).select("_id")
    ]);
    const or: any[] = [
      { users: { $in: users.map((user) => user._id) } },
      { selectedPlace: { $in: places.map((place) => place._id) } }
    ];
    if (mongoose.Types.ObjectId.isValid(q)) or.push({ _id: new mongoose.Types.ObjectId(q) });
    if (["matched", "cafe_proposed", "cafe_confirmed", "chat_opened", "expired", "blocked", "cancelled"].includes(q)) or.push({ status: q });
    query.$or = or;
  }
  res.json({ matches: await Match.find(query).populate("users selectedPlace chatRoom").sort({ createdAt: -1 }).limit(100) });
});

export const adminPlaces = asyncHandler(async (req: Request, res: Response) => {
  const query: any = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.district) query.district = new RegExp(String(req.query.district), "i");
  if (req.query.q) {
    query.$or = [
      { name: new RegExp(String(req.query.q), "i") },
      { address: new RegExp(String(req.query.q), "i") }
    ];
  }
  res.json({ places: await PlaceCache.find(query).sort({ updatedAt: -1 }).limit(100) });
});

export const deletePlace = asyncHandler(async (req: Request, res: Response) => {
  const place = await PlaceCache.findByIdAndDelete(req.params.placeId);
  if (!place) return res.status(404).json({ message: "Cafe not found" });
  await audit(req, "delete_place", "place", req.params.placeId, `Admin deleted cafe: ${place.name}`);
  res.json({ success: true, message: "Cafe deleted successfully" });
});

export const upsertPlace = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.placeId) return res.status(403).json({ message: "Admin không tự tạo quán. Vui lòng duyệt hồ sơ quán từ partner." });
  const openingHoursError = validateOpeningHours(req.body.openingHours);
  if (openingHoursError) return res.status(400).json({ message: openingHoursError });
  const place = req.params.placeId
    ? await PlaceCache.findByIdAndUpdate(req.params.placeId, req.body, { new: true, runValidators: true })
    : await PlaceCache.create(req.body);
  if (!place) return res.status(404).json({ message: "Cafe not found" });
  await audit(req, req.params.placeId ? "update_place" : "create_place", "place", String(place._id), req.body.reason);
  res.json({ place });
});

export const hidePlace = asyncHandler(async (req: Request, res: Response) => {
  const nextStatus = req.body.status ?? "hidden";
  if (!["active", "hidden", "pending", "rejected"].includes(nextStatus)) return res.status(400).json({ message: "Invalid place status" });

  const place = await PlaceCache.findById(req.params.placeId);
  if (!place) return res.status(404).json({ message: "Cafe not found" });
  const previousStatus = place.status;
  place.status = nextStatus;
  await place.save();

  if (nextStatus === "active" && place.isPartnerPlace && place.partnerId) {
    await User.findByIdAndUpdate(place.partnerId, { role: "partner" });
  }

  if (previousStatus !== nextStatus && place.isPartnerPlace && place.partnerId && ["active", "hidden", "rejected"].includes(nextStatus)) {
    const io = req.app.get("io") as Server | undefined;
    await createAndEmitNotification(io, {
      userId: String(place.partnerId),
      type: nextStatus === "active" ? "partner_place_approved" : "partner_place_rejected",
      title: nextStatus === "active" ? "Quán của bạn đã được duyệt" : "Đăng ký quán chưa được duyệt",
      body: nextStatus === "active"
        ? `${place.name} đã được kích hoạt trên UNI-MATE. Bạn có thể vào Quán của tôi để quản lý voucher.`
        : `${place.name} hiện chưa được hiển thị. Vui lòng kiểm tra lại thông tin quán hoặc liên hệ admin.`,
      data: { placeId: String(place._id), status: nextStatus }
    });
  }

  await audit(req, "set_place_status", "place", req.params.placeId, req.body.reason);
  res.json({ place });
});

export const adminTags = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ tags: await Tag.find().sort({ type: 1, name: 1 }) });
});

export const upsertTag = asyncHandler(async (req: Request, res: Response) => {
  const tag = req.params.tagId
    ? await Tag.findByIdAndUpdate(req.params.tagId, req.body, { new: true, runValidators: true })
    : await Tag.create(req.body);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  await audit(req, req.params.tagId ? "update_tag" : "create_tag", "tag", String(tag._id), req.body.reason);
  res.json({ tag });
});

export const adminActions = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ actions: await AdminAction.find().populate("admin", "email displayName").sort({ createdAt: -1 }).limit(100) });
});
