import type { Request, Response } from "express";
import { PlaceCache } from "../models/PlaceCache.js";
import { Voucher } from "../models/Voucher.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function validateOpeningHours(value?: string) {
  if (!value) return "Giờ mở cửa là bắt buộc.";
  if (value === "24/7") return "";
  const match = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return "Giờ mở cửa phải có định dạng HH:mm - HH:mm.";
  const open = Number(match[1]) * 60 + Number(match[2]);
  const close = Number(match[3]) * 60 + Number(match[4]);
  if (open >= close) return "Giờ đóng cửa phải sau giờ mở cửa.";
  return "";
}

export const listPlaces = asyncHandler(async (_req: Request, res: Response) => {
  const places = await PlaceCache.find({ status: "active" }).sort({ rating: -1, updatedAt: -1 }).limit(100);
  res.json({ places });
});

export const getPlace = asyncHandler(async (req: Request, res: Response) => {
  const place = await PlaceCache.findOne({ _id: req.params.placeId, status: "active" });
  if (!place) return res.status(404).json({ message: "Cafe not found" });
  res.json({ place });
});

export const getPlaceVouchers = asyncHandler(async (req: Request, res: Response) => {
  const vouchers = await Voucher.find({ 
    placeId: req.params.placeId, 
    isActive: true,
    expiresAt: { $gt: new Date() },
    $or: [
      { maxUsageCount: 0 },
      { $expr: { $lt: ["$currentUsageCount", "$maxUsageCount"] } }
    ]
  }).sort({ discountPercent: -1 });
  const userId = req.user!.id;
  res.json({
    vouchers: vouchers.map((voucher) => {
      const data = voucher.toObject();
      return {
        ...data,
        savedByMe: (data.savedBy ?? []).some((id) => String(id) === userId),
        savedBy: undefined
      };
    })
  });
});

export const getSavedVouchers = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const vouchers = await Voucher.find({ savedBy: userId })
    .populate("placeId", "name address district city imageUrl status")
    .sort({ updatedAt: -1 });

  res.json({
    vouchers: vouchers.map((voucher) => {
      const data = voucher.toObject();
      return {
        ...data,
        savedByMe: true,
        savedBy: undefined
      };
    })
  });
});

export const saveVoucher = asyncHandler(async (req: Request, res: Response) => {
  const { placeId, voucherId } = req.params;
  const userId = req.user!.id;

  const alreadySaved = await Voucher.findOne({ _id: voucherId, placeId, savedBy: userId });
  if (alreadySaved) return res.json({ voucher: alreadySaved, saved: true, alreadySaved: true });

  const voucher = await Voucher.findOneAndUpdate(
    {
      _id: voucherId,
      placeId,
      isActive: true,
      expiresAt: { $gt: new Date() },
      savedBy: { $ne: userId },
      $or: [
        { maxUsageCount: 0 },
        { $expr: { $lt: ["$currentUsageCount", "$maxUsageCount"] } }
      ]
    },
    {
      $addToSet: { savedBy: userId },
      $inc: { currentUsageCount: 1 }
    },
    { new: true }
  );

  if (!voucher) return res.status(400).json({ message: "Voucher đã hết lượt hoặc không còn khả dụng." });
  res.json({ voucher, saved: true, alreadySaved: false });
});

/** POST /api/places/partner-register — Register a partner cafe */
export const getMyPartnerRegistration = asyncHandler(async (req: Request, res: Response) => {
  const place = await PlaceCache.findOne({ partnerId: req.user!.id, isPartnerPlace: true }).sort({ createdAt: -1 });
  res.json({ place });
});

export const registerPartnerPlace = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, streetAddress, ward, addressNote, mapPinNote, description, cafeVibe, priceLevel, tags, amenities, openingHours, partnerName, city, district, lat, lng } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Tên quán là bắt buộc." });
  if (!cafeVibe) return res.status(400).json({ message: "Vui lòng chọn phong cách quán." });
  if (!partnerName?.trim()) return res.status(400).json({ message: "Tên chủ quán là bắt buộc." });
  const openingHoursError = validateOpeningHours(openingHours);
  if (openingHoursError) return res.status(400).json({ message: openingHoursError });

  const existingApplication = await PlaceCache.findOne({
    partnerId: req.user!.id,
    isPartnerPlace: true,
    status: { $in: ["pending", "active"] }
  });
  if (existingApplication) {
    return res.status(409).json({ message: "Bạn đã có hồ sơ quán đang chờ duyệt hoặc đã được duyệt." });
  }

  const place = await PlaceCache.create({
    name: name.trim(),
    address,
    streetAddress,
    ward,
    addressNote,
    mapPinNote,
    description,
    city: city ?? "TP.HCM",
    district,
    priceLevel: priceLevel ?? "$$",
    tags: tags ?? [],
    amenities: amenities ?? [],
    openingHours,
    cafeVibe,
    partnerName: partnerName.trim(),
    partnerId: req.user!.id,
    isPartnerPlace: true,
    status: "pending",
    showWithoutRating: true,
    location: { type: "Point", coordinates: [lng ?? 106.7009, lat ?? 10.7769] }
  });

  res.status(201).json({ place, message: "Quán đã được gửi đăng ký. Admin sẽ duyệt trong 24h." });
});
