import mongoose, { Schema } from "mongoose";
const messageSchema = new Schema({
    room: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    type: { type: String, enum: ["text", "image", "video", "file"], default: "text" },
    fileUrl: { type: String },
    fileName: { type: String },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
export const Message = mongoose.model("Message", messageSchema);
