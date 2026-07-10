import { z } from "zod";
export const onboardingSchema = z.object({
    body: z.object({
        disclaimerAccepted: z.boolean().refine((v) => v === true, { message: "Bạn cần đồng ý điều khoản" }),
        displayName: z.string().min(2, "Tên hiển thị cần ít nhất 2 ký tự").max(50, "Tên hiển thị quá dài"),
        birthDate: z.coerce.date().refine((date) => {
            const ageDiffMs = Date.now() - date.getTime();
            const ageDate = new Date(ageDiffMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            return age >= 18 && age < 30;
        }, { message: "Bạn phải từ 18 đến dưới 30 tuổi" }),
        gender: z.enum(["male", "female", "other", "prefer_not"], { required_error: "Chọn giới tính" }),
        school: z.string().optional(),
        major: z.string().optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        profilePhotos: z.array(z.string().url().or(z.literal(""))).default([]),
        purpose: z.array(z.enum(["study_buddy", "cafe_chat", "boardgame_sport", "dating"])).min(1, "Chọn ít nhất 1 mục đích"),
        goals: z.array(z.string()).min(1, "Chọn ít nhất 1 mục tiêu gặp"),
        preferredTimes: z.array(z.string()).default([]),
        cafeStyles: z.array(z.string()).min(3, "Chọn ít nhất 3 gu cafe"),
        budgetRange: z.enum(["under_40", "40_70", "70_120", "above_120"]),
        frequency: z.enum(["rarely", "weekly", "few_times_week", "daily"]),
        majorPreference: z.enum(["same", "different", "any"]).default("any"),
        vibePreference: z.enum(["quiet_study", "acoustic_view", "boardgame_lively"], { required_error: "Chọn vibe gặp mặt" }),
        personality: z.object({
            introvertExtrovert: z.number().min(1).max(5),
            talkListen: z.number().min(1).max(5),
            newPeopleComfort: z.number().min(1).max(5),
            studyChillBalance: z.number().min(1).max(5),
            plannedSpontaneous: z.number().min(1).max(5)
        }),
        interests: z.array(z.string()).min(3, "Chọn ít nhất 3 sở thích"),
        preferences: z.object({
            preferredGender: z.enum(["same", "opposite", "all"], { required_error: "Chọn đối tượng muốn match" }),
            ageRange: z.object({ min: z.number().min(18), max: z.number().max(29) }).refine((range) => range.min <= range.max, { message: "Khoảng tuổi mong muốn chưa hợp lệ" }),
            maxDistanceKm: z.number().min(1, "Bán kính tối thiểu là 1km").max(20, "Bán kính tối đa là 20km"),
            priorities: z.array(z.enum(["nearby", "same_interest"])).default(["nearby", "same_interest"])
        }),
        location: z.object({
            lat: z.number({ required_error: "Thiếu tọa độ khu vực" }),
            lng: z.number({ required_error: "Thiếu tọa độ khu vực" }),
            addressLabel: z.string().optional(),
            source: z.enum(["gps", "manual"]).default("manual")
        })
    })
});
export const locationSchema = z.object({
    body: z.object({ lat: z.number(), lng: z.number(), addressLabel: z.string().optional(), source: z.enum(["gps", "manual"]).default("manual") })
});
export const geocodeLocationSchema = z.object({
    body: z.object({
        city: z.string().trim().min(3, "Nhập thành phố/tỉnh rõ hơn").max(80),
        district: z.string().trim().min(3, "Nhập quận/khu vực rõ hơn").max(80)
    })
});
