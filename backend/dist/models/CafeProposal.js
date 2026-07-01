import mongoose, { Schema } from "mongoose";
const cafeProposalSchema = new Schema({
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    proposedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cafe: { type: Schema.Types.ObjectId, ref: "PlaceCache", required: true },
    status: { type: String, enum: ["active", "accepted", "replaced", "expired"], default: "active", index: true }
}, { timestamps: true });
cafeProposalSchema.index({ match: 1, status: 1 });
export const CafeProposal = mongoose.model("CafeProposal", cafeProposalSchema);
