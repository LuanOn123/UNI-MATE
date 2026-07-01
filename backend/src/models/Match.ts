import mongoose, { Schema, type InferSchemaType } from "mongoose";

const matchSchema = new Schema(
  {
    users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    status: {
      type: String,
      enum: ["matched", "cafe_proposed", "cafe_confirmed", "chat_opened", "expired", "blocked", "cancelled"],
      default: "matched"
    },
    selectedPlace: { type: Schema.Types.ObjectId, ref: "PlaceCache" },
    selectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    confirmedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    chatRoom: { type: Schema.Types.ObjectId, ref: "ChatRoom" },
    expiresAt: Date,
    score: { type: Number, default: 0 },
    reasons: [{ type: String }]
  },
  { timestamps: true }
);

matchSchema.index({ users: 1 });
matchSchema.index({ status: 1 });

export type MatchDoc = InferSchemaType<typeof matchSchema> & { _id: mongoose.Types.ObjectId };
export const Match = mongoose.model("Match", matchSchema);
