import mongoose, { Schema } from "mongoose";
const locationSchema = new Schema({
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
    addressLabel: String,
    source: { type: String, enum: ["gps", "manual"], default: "manual" }
}, { _id: false });
const onboardingSchema = new Schema({
    goals: [{ type: String }],
    preferredTimes: [{ type: String }],
    cafeStyles: [{ type: String }],
    budgetRange: String,
    frequency: String,
    purpose: [{ type: String, enum: ["study_buddy", "cafe_chat", "boardgame_sport", "dating"] }],
    majorPreference: { type: String, enum: ["same", "different", "any"], default: "any" },
    vibePreference: { type: String, enum: ["quiet_study", "acoustic_view", "boardgame_lively"], default: "quiet_study" },
    personality: {
        introvertExtrovert: { type: Number, min: 1, max: 5, default: 3 },
        talkListen: { type: Number, min: 1, max: 5, default: 3 },
        newPeopleComfort: { type: Number, min: 1, max: 5, default: 3 },
        studyChillBalance: { type: Number, min: 1, max: 5, default: 3 },
        plannedSpontaneous: { type: Number, min: 1, max: 5, default: 3 }
    },
    interests: [{ type: String }],
    preferences: {
        preferredGender: { type: String, enum: ["same", "opposite", "all"], default: "all" },
        ageRange: { min: { type: Number, default: 18 }, max: { type: Number, default: 30 } },
        maxDistanceKm: { type: Number, min: 1, max: 100, default: 10 },
        priorities: [{ type: String }]
    }
}, { _id: false });
const userSchema = new Schema({
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    passwordHash: String,
    twoFactorEnabled: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin", "partner"], default: "user" },
    status: { type: String, enum: ["active", "suspended", "banned"], default: "active" },
    displayName: { type: String, trim: true },
    birthDate: Date,
    age: Number,
    zodiac: String,
    gender: { type: String, enum: ["male", "female", "other", "prefer_not"], default: "prefer_not" },
    school: String,
    major: String,
    avatarUrl: String,
    profilePhotos: [{ type: String }],
    onboardingCompleted: { type: Boolean, default: false },
    disclaimerAccepted: { type: Boolean, default: false },
    location: { type: locationSchema },
    onboarding: { type: onboardingSchema, default: {} },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    refreshTokenHash: String,
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    lastSeenAt: Date
}, { timestamps: true });
userSchema.index({ role: 1, status: 1, isActive: 1 });
userSchema.index({ location: "2dsphere" });
export const User = mongoose.model("User", userSchema);
