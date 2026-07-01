import mongoose, { Schema, type InferSchemaType } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    match: { type: Schema.Types.ObjectId, ref: "Match" },
    reason: { type: String, required: true },
    message: { type: Schema.Types.ObjectId, ref: "Message" },
    details: String,
    priority: { type: Boolean, default: false },
    status: { type: String, enum: ["new", "reviewing", "resolved_valid", "resolved_invalid", "dismissed"], default: "new" },
    adminNote: String
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

export type ReportDoc = InferSchemaType<typeof reportSchema> & { _id: mongoose.Types.ObjectId };
export const Report = mongoose.model("Report", reportSchema);
