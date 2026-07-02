import mongoose, { Schema } from "mongoose";
const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: String,
    data: { type: Schema.Types.Mixed },
    readAt: Date
}, { timestamps: true });
export const Notification = mongoose.model("Notification", notificationSchema);
