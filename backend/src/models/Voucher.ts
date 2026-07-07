import mongoose, { Schema, type InferSchemaType } from "mongoose";

const voucherSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    placeId: { type: Schema.Types.ObjectId, ref: "PlaceCache", required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    maxUsageCount: { type: Number, default: 0 }, // 0 means unlimited
    currentUsageCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

voucherSchema.index({ placeId: 1, isActive: 1 });
voucherSchema.index({ partnerId: 1 });
voucherSchema.index({ code: 1, placeId: 1 }, { unique: true }); // Prevent duplicate codes for the same place

export type VoucherDoc = InferSchemaType<typeof voucherSchema> & { _id: mongoose.Types.ObjectId };
export const Voucher = mongoose.model("Voucher", voucherSchema);
