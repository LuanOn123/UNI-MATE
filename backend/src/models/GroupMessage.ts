import mongoose, { Schema, type InferSchemaType } from "mongoose";

const groupMessageSchema = new Schema(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    type: { type: String, enum: ["text", "image", "video", "file"], default: "text" },
    fileUrl: { type: String },
    fileName: { type: String },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export type GroupMessageDoc = InferSchemaType<typeof groupMessageSchema> & { _id: mongoose.Types.ObjectId };
export const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);
