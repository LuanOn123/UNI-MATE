import mongoose, { Schema } from "mongoose";
const placeCacheSchema = new Schema({
    googlePlaceId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    address: String,
    city: { type: String, default: "TP.HCM" },
    district: String,
    rating: Number,
    userRatingsTotal: Number,
    priceLevel: { type: String, enum: ["$", "$$", "$$$", "$$$$"], default: "$$" },
    status: { type: String, enum: ["active", "hidden"], default: "active", index: true },
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
    }
}, { timestamps: true });
placeCacheSchema.index({ location: "2dsphere" });
export const PlaceCache = mongoose.model("PlaceCache", placeCacheSchema);
