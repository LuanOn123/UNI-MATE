import mongoose, { Schema, type InferSchemaType } from "mongoose";

const chatRoomSchema = new Schema(
  {
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true, unique: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    place: { type: Schema.Types.ObjectId, ref: "PlaceCache", required: true },
    status: { type: String, enum: ["active", "blocked", "archived"], default: "active", index: true },
    lastMessage: String,
    lastMessageAt: Date
  },
  { timestamps: true }
);

export type ChatRoomDoc = InferSchemaType<typeof chatRoomSchema> & { _id: mongoose.Types.ObjectId };
export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
