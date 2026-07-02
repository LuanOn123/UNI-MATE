import { z } from "zod";
export const onboardingSchema = z.object({
    body: z.object({
        displayName: z.string().min(1),
        birthDate: z.coerce.date(),
        gender: z.enum(["male", "female", "other", "prefer_not"]),
        school: z.string().optional(),
        major: z.string().optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        profilePhotos: z.array(z.string().url().or(z.literal(""))).default([]),
        goals: z.array(z.string()).min(1),
        preferredTimes: z.array(z.string()).default([]),
        cafeStyles: z.array(z.string()).min(3),
        budgetRange: z.string(),
        frequency: z.string(),
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
