import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: ["cafe", "profile"], default: "cafe" },
    status: { type: String, enum: ["active", "hidden"], default: "active" }
  },
  { timestamps: true }
);

export type TagDoc = InferSchemaType<typeof tagSchema> & { _id: mongoose.Types.ObjectId };
export const Tag = mongoose.model("Tag", tagSchema);
