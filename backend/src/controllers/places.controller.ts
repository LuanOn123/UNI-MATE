import type { Request, Response } from "express";
import { PlaceCache } from "../models/PlaceCache.js";
import { Voucher } from "../models/Voucher.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
    expiresAt: { $gt: new Date() }
  }).sort({ discountPercent: -1 });
  res.json({ vouchers });
});

/** POST /api/places/partner-register — Register a partner cafe */
export const getMyPartnerRegistration = asyncHandler(async (req: Request, res: Response) => {
  const place = await PlaceCache.findOne({ partnerId: req.user!.id, isPartnerPlace: true }).sort({ createdAt: -1 });
  res.json({ place });
});

export const registerPartnerPlace = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, description, cafeVibe, tags, amenities, openingHours, partnerName, city, district, lat, lng } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Tên quán là bắt buộc." });
  if (!cafeVibe) return res.status(400).json({ message: "Vui lòng chọn phong cách quán." });
  if (!partnerName?.trim()) return res.status(400).json({ message: "Tên chủ quán là bắt buộc." });

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
    description,
    city: city ?? "TP.HCM",
    district,
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
