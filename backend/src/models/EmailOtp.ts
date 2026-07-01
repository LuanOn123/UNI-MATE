import mongoose, { Schema, type InferSchemaType } from "mongoose";

const emailOtpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

emailOtpSchema.index({ email: 1, createdAt: -1 });
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type EmailOtpDoc = InferSchemaType<typeof emailOtpSchema> & { _id: mongoose.Types.ObjectId };
export const EmailOtp = mongoose.model("EmailOtp", emailOtpSchema);
