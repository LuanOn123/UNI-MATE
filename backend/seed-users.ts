import mongoose from "mongoose";
import { User } from "./src/models/User.js";
import { env } from "./src/config/env.js";

const genders = ["male", "female"];
const names = [
  "Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E",
  "Vũ Thị F", "Đặng Văn G", "Bùi Thị H", "Đỗ Văn I", "Hồ Thị K"
];

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB");

    for (let i = 0; i < 10; i++) {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - (18 + Math.floor(Math.random() * 5))); // Age 18-22

      // Check if user already exists
      const email = `testuser${i}@example.com`;
      const existing = await User.findOne({ email });
      if (existing) {
        console.log(`User ${email} already exists, skipping.`);
        continue;
      }

      const user = new User({
        email: email,
        emailVerified: true,
        displayName: names[i],
        birthDate: birthDate,
        age: new Date().getFullYear() - birthDate.getFullYear(),
        gender: genders[i % 2],
        school: "Đại học Bách Khoa",
        major: "Khoa học máy tính",
        avatarUrl: `https://i.pravatar.cc/150?u=testuser${i}`,
        onboardingCompleted: true,
        disclaimerAccepted: true,
        location: {
          type: "Point",
          coordinates: [106.660172, 10.762622], // HCM city center roughly
          addressLabel: "Quận 10, TP HCM",
          source: "manual"
        },
        onboarding: {
          goals: ["Tìm bạn học", "Nói chuyện chill"],
          preferredTimes: ["Buổi tối"],
          cafeStyles: ["Yên tĩnh", "Acoustic", "Có mèo"],
          budgetRange: "40_70",
          frequency: "weekly",
          purpose: "study_buddy",
          majorPreference: "any",
          vibePreference: "quiet_study",
          personality: {
            introvertExtrovert: 3,
            talkListen: 3,
            newPeopleComfort: 3,
            studyChillBalance: 3,
            plannedSpontaneous: 3
          },
          interests: ["Đọc sách", "Nghe nhạc", "Code"],
          preferences: {
            preferredGender: "all",
            ageRange: { min: 18, max: 25 },
            maxDistanceKm: 10,
            priorities: ["Gần nhà"]
          }
        },
        isActive: true
      });

      await user.save();
      console.log(`Created user: ${user.email}`);
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding users:", err);
    process.exit(1);
  }
}

seed();
