import mongoose, { Schema } from "mongoose";
const swipeSchema = new Schema({
    fromUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["like", "pass"], required: true }
}, { timestamps: true });
swipeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
export const Swipe = mongoose.model("Swipe", swipeSchema);
