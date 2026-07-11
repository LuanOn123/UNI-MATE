import mongoose, { Schema, type InferSchemaType } from "mongoose";

const placeCacheSchema = new Schema(
  {
    googlePlaceId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    address: String,
    city: { type: String, default: "TP.HCM" },
    district: String,
    rating: Number,
    userRatingsTotal: Number,
    priceLevel: { type: String, enum: ["$", "$$", "$$$", "$$$$"], default: "$$" },
    status: { type: String, enum: ["active", "hidden", "pending", "rejected"], default: "active", index: true },
    tags: [{ type: String }],
    amenities: [{ type: String }],
    openingHours: String,
    description: String,
    imageUrl: String,
    showWithoutRating: { type: Boolean, default: true },
    openNow: Boolean,
    mapsUrl: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    },
    // --- Partner cafe fields ---
    isPartnerPlace: { type: Boolean, default: false },
    partnerId: { type: Schema.Types.ObjectId, ref: "User", sparse: true },
    partnerName: String,
    cafeVibe: { type: String, enum: ["quiet_study", "acoustic_view", "boardgame_lively"] }
  },
  { timestamps: true }
);

placeCacheSchema.index({ location: "2dsphere" });

export type PlaceCacheDoc = InferSchemaType<typeof placeCacheSchema> & { _id: mongoose.Types.ObjectId };
export const PlaceCache = mongoose.model("PlaceCache", placeCacheSchema);
