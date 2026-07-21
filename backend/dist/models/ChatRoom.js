import mongoose, { Schema } from "mongoose";
const chatRoomSchema = new Schema({
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true, unique: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    place: { type: Schema.Types.ObjectId, ref: "PlaceCache" },
    status: { type: String, enum: ["active", "blocked", "archived"], default: "active", index: true },
    hiddenBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: String,
    lastMessageAt: Date
}, { timestamps: true });
export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
