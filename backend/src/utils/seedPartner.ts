import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { PlaceCache } from "../models/PlaceCache.js";

async function seedPartner() {
  await connectDB();
  
  const email = "partner@test.com";
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Create a User for the Partner
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      passwordHash,
      emailVerified: true,
      displayName: "Chủ quán Cà Phê",
      role: "partner",
      onboardingCompleted: true,
      isActive: true,
      location: {
        type: "Point",
        coordinates: [106.7009, 10.7769], // TP.HCM
        source: "manual"
      },
      onboarding: {
        purpose: "cafe_chat",
        vibePreference: "acoustic_view"
      }
    });
    console.log(`✅ Đã tạo tài khoản Partner: ${email} / ${password}`);
  } else {
    console.log(`⚠️ Tài khoản ${email} đã tồn tại.`);
  }

  // 2. Also simulate creating a Partner Place so it's already there (Optional, but good for testing)
  const existingPlace = await PlaceCache.findOne({ partnerId: user._id });
  if (!existingPlace) {
    await PlaceCache.create({
      name: "The Dreamer Cafe",
      address: "123 Đường Sách, Quận 1",
      city: "TP.HCM",
      district: "Quận 1",
      description: "Quán cafe view cực xịn cho dân acoustic",
      cafeVibe: "acoustic_view",
      tags: ["acoustic", "view", "chill"],
      amenities: ["wifi", "power"],
      openingHours: "08:00 - 22:00",
      partnerName: "Chủ quán Cà Phê",
      partnerId: user._id,
      isPartnerPlace: true,
      status: "active", // Đã được admin duyệt
      showWithoutRating: true,
      location: { type: "Point", coordinates: [106.7009, 10.7769] }
    });
    console.log(`✅ Đã tạo một quán cafe đối tác "The Dreamer Cafe" thuộc về ${email}`);
  } else {
    console.log(`⚠️ Quán đối tác của tài khoản này đã tồn tại.`);
  }

  mongoose.disconnect();
  console.log("Xong!");
}

seedPartner().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
