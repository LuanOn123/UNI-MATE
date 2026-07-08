import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAge, getZodiac } from "../utils/zodiac.js";
import { env } from "../config/env.js";

export const completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const age = getAge(new Date(req.body.birthDate));
  if (age < 18) return res.status(422).json({ message: "User must be at least 18" });
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      displayName: req.body.displayName,
      birthDate: req.body.birthDate,
      age,
      zodiac: getZodiac(new Date(req.body.birthDate)),
      gender: req.body.gender,
      school: req.body.school,
      major: req.body.major,
      avatarUrl: req.body.avatarUrl,
      profilePhotos: (req.body.profilePhotos ?? []).filter(Boolean),
      onboardingCompleted: true,
      disclaimerAccepted: req.body.disclaimerAccepted ?? false,
      onboarding: {
        goals: req.body.goals,
        preferredTimes: req.body.preferredTimes,
        cafeStyles: req.body.cafeStyles,
        budgetRange: req.body.budgetRange,
        frequency: req.body.frequency,
        purpose: req.body.purpose,
        majorPreference: req.body.majorPreference,
        vibePreference: req.body.vibePreference,
        personality: req.body.personality,
        interests: req.body.interests,
        preferences: req.body.preferences
      },
      location: { type: "Point", coordinates: [req.body.location.lng, req.body.location.lat], addressLabel: req.body.location.addressLabel, source: req.body.location.source ?? "manual" }
    },
    { new: true }
  );
  res.json({ user });
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { location: { type: "Point", coordinates: [req.body.lng, req.body.lat], addressLabel: req.body.addressLabel, source: req.body.source ?? "manual" } },
    { new: true }
  );
  res.json({ user });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const url = `${env.UPLOAD_BASE_URL}/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user!.id, { avatarUrl: url });
  res.json({ url });
});

export const uploadProfilePhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const url = `${env.UPLOAD_BASE_URL}/${req.file.filename}`;
  res.json({ url });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select("-refreshTokenHash");
  res.json({ user });
});
