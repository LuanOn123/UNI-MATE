import mongoose, { Schema } from "mongoose";
const otpSchema = new Schema({
    email: { type: String, required: true, lowercase: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 }
}, { timestamps: true });
export const Otp = mongoose.model("Otp", otpSchema);
