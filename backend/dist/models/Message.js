import mongoose, { Schema } from "mongoose";
const messageSchema = new Schema({
    room: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
export const Message = mongoose.model("Message", messageSchema);
