import mongoose, { Schema, type InferSchemaType } from "mongoose";

const adminActionSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: String
  },
  { timestamps: true }
);

adminActionSchema.index({ admin: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });

export type AdminActionDoc = InferSchemaType<typeof adminActionSchema> & { _id: mongoose.Types.ObjectId };
export const AdminAction = mongoose.model("AdminAction", adminActionSchema);
