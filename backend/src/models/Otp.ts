import mongoose, { Schema, type InferSchemaType } from "mongoose";

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export type OtpDoc = InferSchemaType<typeof otpSchema> & { _id: mongoose.Types.ObjectId };
export const Otp = mongoose.model("Otp", otpSchema);
