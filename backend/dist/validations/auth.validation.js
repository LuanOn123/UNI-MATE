import { z } from "zod";
const passwordSchema = z.string()
    .min(8)
    .max(128)
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" });
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email().toLowerCase(),
        password: passwordSchema
    })
});
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email().toLowerCase(),
        password: passwordSchema
    })
});
export const sendOtpSchema = z.object({
    body: z.object({
        email: z.string().email().toLowerCase(),
        password: passwordSchema.optional()
    })
});
export const verifyOtpSchema = z.object({
    body: z.object({
        email: z.string().email().toLowerCase(),
        otp: z.string().regex(/^\d{6}$/).optional(),
        code: z.string().regex(/^\d{6}$/).optional()
    }).refine((body) => body.otp || body.code, { message: "OTP is required", path: ["otp"] })
});
