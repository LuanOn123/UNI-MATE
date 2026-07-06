import { z } from "zod";

export const onboardingSchema = z.object({
  body: z.object({
    disclaimerAccepted: z.boolean().refine((v) => v === true, { message: "Bạn cần đồng ý điều khoản" }),
    displayName: z.string().min(2).max(50),
    birthDate: z.coerce.date().refine((date) => {
      const ageDiffMs = Date.now() - date.getTime();
      const ageDate = new Date(ageDiffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970) >= 18;
    }, { message: "Bạn phải từ 18 tuổi trở lên" }),
    gender: z.enum(["male", "female", "other", "prefer_not"]),
    school: z.string().optional(),
    major: z.string().optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
    profilePhotos: z.array(z.string().url().or(z.literal(""))).default([]),
    purpose: z.array(z.enum(["study_buddy", "cafe_chat", "boardgame_sport", "dating"])).min(1, "Chọn ít nhất 1 mục đích"),
    goals: z.array(z.string()).min(1),
    preferredTimes: z.array(z.string()).default([]),
    cafeStyles: z.array(z.string()).min(3),
    budgetRange: z.enum(["under_40", "40_70", "70_120", "above_120"]),
    frequency: z.enum(["rarely", "weekly", "few_times_week", "daily"]),
    majorPreference: z.enum(["same", "different", "any"]).default("any"),
    vibePreference: z.enum(["quiet_study", "acoustic_view", "boardgame_lively"]),
    personality: z.object({
      introvertExtrovert: z.number().min(1).max(5),
      talkListen: z.number().min(1).max(5),
      newPeopleComfort: z.number().min(1).max(5),
      studyChillBalance: z.number().min(1).max(5),
      plannedSpontaneous: z.number().min(1).max(5)
    }),
    interests: z.array(z.string()).min(3),
    preferences: z.object({
      preferredGender: z.enum(["same", "opposite", "all"]),
      ageRange: z.object({ min: z.number().min(18), max: z.number().max(80) }),
      maxDistanceKm: z.number().min(1).max(20),
      priorities: z.array(z.string()).default([])
    }),
    location: z.object({ lat: z.number(), lng: z.number(), addressLabel: z.string().optional(), source: z.enum(["gps", "manual"]).default("manual") })
  })
});

export const locationSchema = z.object({
  body: z.object({ lat: z.number(), lng: z.number(), addressLabel: z.string().optional(), source: z.enum(["gps", "manual"]).default("manual") })
});
