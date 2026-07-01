import type { Request, Response } from "express";
import { PlaceCache } from "../models/PlaceCache.js";
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
