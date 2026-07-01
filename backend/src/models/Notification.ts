import mongoose, { Schema, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: String,
    readAt: Date
  },
  { timestamps: true }
);

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: mongoose.Types.ObjectId };
export const Notification = mongoose.model("Notification", notificationSchema);
