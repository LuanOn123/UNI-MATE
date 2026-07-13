import type { Request, Response } from "express";
import { PlaceCache } from "../models/PlaceCache.js";
import { Voucher } from "../models/Voucher.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

/** GET /api/partner/places — List all places registered by this partner */
export const getMyPlaces = asyncHandler(async (req: Request, res: Response) => {
  const partnerId = req.user!.id;
  const places = await PlaceCache.find({ partnerId }).sort({ createdAt: -1 });
  res.json({ places });
});

export const updateMyPlace = asyncHandler(async (req: Request, res: Response) => {
  const partnerId = req.user!.id;
  const { placeId } = req.params;
  const allowed = [
    "name",
    "address",
    "streetAddress",
    "ward",
    "addressNote",
    "mapPinNote",
    "description",
    "city",
    "district",
    "priceLevel",
    "tags",
    "amenities",
    "openingHours",
    "cafeVibe",
    "partnerName",
    "imageUrl"
  ];
  const openingHoursError = validateOpeningHours(req.body.openingHours);
  if (openingHoursError) return res.status(400).json({ message: openingHoursError });
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const place = await PlaceCache.findOneAndUpdate({ _id: placeId, partnerId }, update, { new: true, runValidators: true });
  if (!place) return res.status(403).json({ message: "Không tìm thấy quán hoặc bạn không có quyền." });
  res.json({ place });
});

/** GET /api/partner/places/:placeId/vouchers — List vouchers for a specific place */
export const getPlaceVouchers = asyncHandler(async (req: Request, res: Response) => {
  const { placeId } = req.params;
  const partnerId = req.user!.id;

  const place = await PlaceCache.findOne({ _id: placeId, partnerId });
  if (!place) return res.status(403).json({ message: "Không tìm thấy quán hoặc bạn không có quyền." });

  const vouchers = await Voucher.find({ placeId }).sort({ createdAt: -1 });
  res.json({ vouchers });
});

/** POST /api/partner/places/:placeId/vouchers — Create a new voucher */
export const createVoucher = asyncHandler(async (req: Request, res: Response) => {
  const { placeId } = req.params;
  const partnerId = req.user!.id;
  const { code, title, description, discountPercent, maxUsageCount, expiresAt, minOrderValue, terms } = req.body;

  const place = await PlaceCache.findOne({ _id: placeId, partnerId });
  if (!place) return res.status(403).json({ message: "Không tìm thấy quán hoặc bạn không có quyền." });

  if (place.status !== "active") return res.status(400).json({ message: "Quán chỉ có thể tạo voucher sau khi admin duyệt." });

  if (!code || !title || !discountPercent || !expiresAt) {
    return res.status(400).json({ message: "Vui lòng điền đủ các trường bắt buộc." });
  }

  const existing = await Voucher.findOne({ placeId, code: code.toUpperCase() });
  if (existing) return res.status(400).json({ message: "Mã giảm giá này đã tồn tại cho quán của bạn." });

  const voucher = await Voucher.create({
    code: code.toUpperCase().trim(),
    placeId,
    partnerId,
    title,
    description,
    discountPercent,
    maxUsageCount: maxUsageCount || 0,
    minOrderValue: minOrderValue || 0,
    terms,
    expiresAt: new Date(expiresAt)
  });

  res.status(201).json({ voucher });
});

/** PATCH /api/partner/vouchers/:id/toggle — Toggle voucher active status */
export const toggleVoucherStatus = asyncHandler(async (req: Request, res: Response) => {
  const voucherId = req.params.id;
  const partnerId = req.user!.id;

  const voucher = await Voucher.findOne({ _id: voucherId, partnerId });
  if (!voucher) return res.status(404).json({ message: "Voucher không tồn tại." });

  voucher.isActive = !voucher.isActive;
  await voucher.save();
  res.json({ voucher });
});

/** DELETE /api/partner/vouchers/:id — Delete a voucher */
export const deleteVoucher = asyncHandler(async (req: Request, res: Response) => {
  const voucherId = req.params.id;
  const partnerId = req.user!.id;

  const voucher = await Voucher.findOneAndDelete({ _id: voucherId, partnerId });
  if (!voucher) return res.status(404).json({ message: "Voucher không tồn tại." });

  res.json({ message: "Đã xóa voucher." });
});
