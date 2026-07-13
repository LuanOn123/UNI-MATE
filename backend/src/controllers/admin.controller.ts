import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import type { Server } from "socket.io";
import { AdminAction } from "../models/AdminAction.js";
import { ChatRoom } from "../models/ChatRoom.js";
import { Match } from "../models/Match.js";
import { Message } from "../models/Message.js";
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

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [users, newUsers, matches, confirmed, reports, places, rooms] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } }),
    Match.countDocuments(),
    Match.countDocuments({ status: { $in: ["cafe_confirmed", "chat_opened"] } }),
    Report.countDocuments({ status: "new" }),
    PlaceCache.countDocuments({ status: "active" }),
    ChatRoom.countDocuments({ status: "active" })
  ]);
  res.json({ stats: { users, newUsers, matches, confirmed, newReports: reports, activePlaces: places, activeRooms: rooms } });
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
  const statusUpdate: any = { $set: { status, isActive: status === "active" } };
  if (status !== "suspended") statusUpdate.$unset = { suspendedUntil: 1 };
  const user = await User.findByIdAndUpdate(req.params.userId, statusUpdate, { new: true }).select("-refreshTokenHash -passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  await audit(req, status === "active" ? "reactivate_user" : status, "user", req.params.userId, reason);
  res.json({ user });
});

export const adminReports = asyncHandler(async (req: Request, res: Response) => {
  const query: any = {};
  if (req.query.status) query.status = req.query.status;
  const reports = await Report.find(query)
    .populate("reporter", "displayName email avatarUrl")
    .populate("reportedUser", "displayName email avatarUrl warningCount status suspendedUntil")
    .populate("match message")
    .sort({ priority: -1, createdAt: -1 })
    .limit(100);
  res.json({ reports });
});

export const adminReportDetail = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.findById(req.params.reportId)
    .populate("reporter", "displayName email avatarUrl")
    .populate("reportedUser", "displayName email avatarUrl warningCount status suspendedUntil")
    .populate("match message room");
  if (!report) return res.status(404).json({ message: "Report not found" });
  const messages = report.room
    ? await Message.find({ room: (report.room as any)._id ?? report.room }).sort({ createdAt: -1 }).limit(200).populate("sender", "displayName avatarUrl email")
    : [];
  res.json({ report, messages: messages.reverse() });
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
  const { action, note, reason, suspendDays, suspendedUntil } = req.body;
  const report = await Report.findById(req.params.reportId);
  if (!report) return res.status(404).json({ message: "Report not found" });
  if (report.resolutionAction || ["resolved_valid", "resolved_invalid", "dismissed"].includes(report.status)) {
    return res.status(409).json({ message: "Report này đã được xử lý trước đó" });
  }
  if (!["dismiss", "warn", "suspend", "ban"].includes(action)) return res.status(400).json({ message: "Invalid report action" });

  const io = req.app.get("io") as Server | undefined;
  const user = await User.findById(report.reportedUser);
  if (!user) return res.status(404).json({ message: "Reported user not found" });
  let outcome = action;
  let suspensionEnd: Date | undefined;

  if (action === "dismiss") {
    report.status = "dismissed";
  } else if (action === "warn") {
    user.warningCount = (user.warningCount ?? 0) + 1;
    const count = user.warningCount;
    if (count === 1) {
      await createAndEmitNotification(io, {
        userId: String(user._id),
        type: "moderation_warning",
        title: "Cảnh cáo lần 1",
        body: "Tài khoản của bạn đã nhận một cảnh cáo từ quản trị viên. Vui lòng tuân thủ quy tắc cộng đồng.",
        data: { reportId: String(report._id), warningCount: count }
      });
    } else if (count === 2 || count === 3) {
      const days = count === 2 ? 3 : 10;
      suspensionEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      user.status = "suspended";
      user.isActive = false;
      user.suspendedUntil = suspensionEnd;
      outcome = "suspend";
      await createAndEmitNotification(io, {
        userId: String(user._id),
        type: "moderation_suspension",
        title: `Tài khoản bị tạm khóa ${days} ngày`,
        body: `Bạn đã nhận cảnh cáo lần ${count}. Tài khoản bị tạm khóa đến ${suspensionEnd.toLocaleString("vi-VN")}.`,
        data: { reportId: String(report._id), warningCount: count, suspendedUntil: suspensionEnd.toISOString() }
      });
    } else {
      user.status = "banned";
      user.isActive = false;
      user.suspendedUntil = undefined;
      outcome = "ban";
      await createAndEmitNotification(io, {
        userId: String(user._id),
        type: "moderation_ban",
        title: "Tài khoản đã bị khóa",
        body: "Tài khoản của bạn đã bị khóa do nhận đủ 4 lần cảnh cáo.",
        data: { reportId: String(report._id), warningCount: count }
      });
    }
    report.status = "resolved_valid";
    await user.save();
  } else if (action === "suspend") {
    if (suspendDays !== undefined && ![3, 5, 7].includes(Number(suspendDays))) return res.status(400).json({ message: "Số ngày tạm khóa chỉ được chọn 3, 5 hoặc 7 ngày" });
    suspensionEnd = suspendedUntil ? new Date(suspendedUntil) : new Date(Date.now() + Number(suspendDays || 3) * 24 * 60 * 60 * 1000);
    if (!Number.isFinite(suspensionEnd.getTime()) || suspensionEnd.getTime() <= Date.now()) return res.status(400).json({ message: "Ngày kết thúc tạm khóa phải ở tương lai" });
    user.status = "suspended";
    user.isActive = false;
    user.suspendedUntil = suspensionEnd;
    await user.save();
    report.status = "resolved_valid";
    await createAndEmitNotification(io, {
      userId: String(user._id),
      type: "moderation_suspension",
      title: "Tài khoản bị tạm khóa",
      body: `Tài khoản của bạn bị tạm khóa đến ${suspensionEnd.toLocaleString("vi-VN")}.`,
      data: { reportId: String(report._id), suspendedUntil: suspensionEnd.toISOString() }
    });
  } else if (action === "ban") {
    user.status = "banned";
    user.isActive = false;
    user.suspendedUntil = undefined;
    await user.save();
    report.status = "resolved_valid";
    await createAndEmitNotification(io, {
      userId: String(user._id),
      type: "moderation_ban",
      title: "Tài khoản đã bị khóa",
      body: "Quản trị viên đã khóa tài khoản của bạn do vi phạm quy tắc cộng đồng.",
      data: { reportId: String(report._id) }
    });
  }
  report.resolutionAction = action;
  report.adminNote = note;
  await report.save();
  await audit(req, `report_${outcome}`, "report", req.params.reportId, reason ?? note);
  if (user.status === "suspended" || user.status === "banned") io?.in(`user:${String(user._id)}`).disconnectSockets(true);
  res.json({ report, moderation: { action: outcome, warningCount: user.warningCount ?? 0, suspendedUntil: suspensionEnd } });
});

export const adminMatches = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ matches: await Match.find().populate("users selectedPlace chatRoom").sort({ createdAt: -1 }).limit(100) });
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

export const adminPlaceDetail = asyncHandler(async (req: Request, res: Response) => {
  const place = await PlaceCache.findById(req.params.placeId);
  if (!place) return res.status(404).json({ message: "Cafe not found" });
  const matches = await Match.find({ selectedPlace: place._id }).populate("users").sort({ createdAt: -1 }).limit(50);
  res.json({ place, matches });
});

