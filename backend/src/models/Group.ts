import mongoose, { Schema, type InferSchemaType } from "mongoose";

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    purpose: { type: String, enum: ["study_buddy", "cafe_chat", "boardgame_sport", "dating", "other"], default: "cafe_chat" },
    maxMembers: { type: Number, default: 6, min: 2, max: 20 },
    status: { type: String, enum: ["active", "dissolved"], default: "active" }
  },
  { timestamps: true }
);

groupSchema.index({ creator: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ status: 1 });

export type GroupDoc = InferSchemaType<typeof groupSchema> & { _id: mongoose.Types.ObjectId };
export const Group = mongoose.model("Group", groupSchema);
