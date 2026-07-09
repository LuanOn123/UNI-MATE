import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { PlaceCache } from "../models/PlaceCache.js";

async function seedPlaces() {
  await connectDB();

  // 1. Duyệt quán pending (nếu có TTest2 hoặc các quán đang chờ) chuyển thành active để dễ test
  await PlaceCache.updateMany({ status: "pending" }, { $set: { status: "active" } });

  const existingNames = (await PlaceCache.find().select("name")).map((p) => p.name);

  const samples = [
    {
      name: "UNI Brew Study",
      address: "45 Đinh Tiên Hoàng, Quận 1, TP.HCM",
      city: "TP.HCM",
      district: "Quận 1",
      rating: 4.6,
      userRatingsTotal: 128,
      status: "active",
      tags: ["study", "wifi", "quiet"],
      amenities: ["wifi", "power", "air_con"],
      openNow: true,
      mapsUrl: "https://maps.google.com",
      cafeVibe: "quiet_study",
      location: { type: "Point", coordinates: [106.7019, 10.7829] },
      description: "Quán cà phê yên tĩnh, nhiều ổ cắm, bàn ghế làm việc/học tập cực chuẩn cho sinh viên."
    },
    {
      name: "Milk Coffee Corner",
      address: "12 Sư Vạn Hạnh, Quận 10, TP.HCM",
      city: "TP.HCM",
      district: "Quận 10",
      rating: 4.5,
      userRatingsTotal: 94,
      status: "active",
      tags: ["chill", "quiet", "acoustic"],
      amenities: ["wifi", "air_con"],
      openNow: true,
      mapsUrl: "https://maps.google.com",
      cafeVibe: "acoustic_view",
      location: { type: "Point", coordinates: [106.6699, 10.7719] },
      description: "Không gian ấm cúng, nhạc chill nhẹ nhàng, rất phù hợp để hẹn gặp lần đầu và nói chuyện."
    },
    {
      name: "Campus Beans",
      address: "268 Lý Thường Kiệt, Quận 10, TP.HCM",
      city: "TP.HCM",
      district: "Quận 10",
      rating: 4.4,
      userRatingsTotal: 76,
      status: "active",
      tags: ["study", "power", 'group'],
      amenities: ["wifi", "power"],
      openNow: true,
      mapsUrl: "https://maps.google.com",
      cafeVibe: "quiet_study",
      location: { type: "Point", coordinates: [106.6589, 10.7729] },
      description: "Nằm ngay gần Bách Khoa, giá hạt dẻ, wifi siêu mạnh cho các bạn sinh viên chạy deadline."
    },
    {
      name: "Boardgame Kingdom",
      address: "88 Nguyễn Trãi, Quận 5, TP.HCM",
      city: "TP.HCM",
      district: "Quận 5",
      rating: 4.7,
      userRatingsTotal: 210,
      status: "active",
      tags: ["boardgame", "fun", "group"],
      amenities: ["wifi", "air_con"],
      openNow: true,
      mapsUrl: "https://maps.google.com",
      cafeVibe: "boardgame_lively",
      location: { type: "Point", coordinates: [106.6789, 10.7589] },
      description: "Thiên đường boardgame siêu vui nhộn cho các nhóm bạn muốn quẩy hết mình."
    }
  ];

  const toInsert = samples.filter((s) => !existingNames.includes(s.name));
  if (toInsert.length > 0) {
    await PlaceCache.insertMany(toInsert);
    console.log(`✅ Đã chèn thêm ${toInsert.length} quán cafe mẫu vào Database!`);
  } else {
    console.log("⚠️ Các quán mẫu đã tồn tại sẵn trong Database.");
  }

  const allActive = await PlaceCache.find({ status: "active" }).select("name cafeVibe district rating address");
  console.log("\n📋 Danh sách tổng cộng các quán cafe ACTIVE hiện có trong Database:");
  allActive.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.cafeVibe}] ${p.name} - ${p.address} (⭐ ${p.rating || "N/A"})`);
  });

  await mongoose.disconnect();
}

seedPlaces().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
