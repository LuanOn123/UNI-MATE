export const goals = ["Đi cafe trò chuyện", "Học nhóm", "Cùng ngành", "Khám phá quán mới", "Chụp ảnh/check-in", "Làm việc chung", "Tâm sự", "Có thể tiến xa hơn"];
export const preferredTimes = ["sáng", "trưa", "chiều", "tối", "cuối tuần"];
export const cafeStyles = ["yên tĩnh", "acoustic", "view đẹp", "cafe mèo", "specialty coffee", "wifi mạnh", "có ổ cắm", "học bài", "làm việc", "sống ảo"];

// --- Hard Filters: Mục đích hôm nay ---
export const purposeOptions = [
  { value: "study_buddy", label: "Tìm cạ học bài" },
  { value: "cafe_chat", label: "Đi cafe chém gió" },
  { value: "boardgame_sport", label: "Chơi Boardgame/Thể thao" },
  { value: "dating", label: "Hẹn hò" }
];

// --- Soft Filter: Ngành học (Major categories) ---
export const majorCategories = [
  "Công nghệ thông tin",
  "Kinh tế - Kinh doanh",
  "Ngôn ngữ & Nhân văn",
  "Mỹ thuật & Thiết kế",
  "Khoa học sức khỏe",
  "Kỹ thuật & Công nghệ",
  "Khoa học tự nhiên",
  "Luật",
  "Giáo dục",
  "Truyền thông & Báo chí",
  "Du lịch & Khách sạn",
  "Kiến trúc & Xây dựng",
  "Nông - Lâm - Ngư",
  "Khác"
];

// --- Soft Filter: Gu ngành học muốn kết nối ---
export const majorPreferenceOptions = [
  { value: "same", label: "Cùng khối ngành với tôi (để dễ trao đổi kiến thức)" },
  { value: "different", label: "Khác khối ngành (để mở rộng góc nhìn)" },
  { value: "any", label: "Sao cũng được, hợp gu là duyệt!" }
];

// --- Soft Filter: Sở thích phân loại theo nhóm vibe ---
export const interestGroups = [
  {
    label: "Năng động",
    items: ["#ThểThao", "#DuLịch", "#SựKiện", "#TìnhNguyện", "#Gym"]
  },
  {
    label: "Nerd/Geek",
    items: ["#ChơiGame", "#ĐọcSách", "#HọcThuật", "#Code", "#CôngNghệ"]
  },
  {
    label: "Chill",
    items: ["#CàPhê", "#Mèo/Cún", "#XemPhim", "#ÂmNhạc", "#NhiếpẢnh", "#ẨmThực"]
  }
];

// Flatten all interest tags for data submission
export const interests = interestGroups.flatMap((group) => group.items);

// --- Soft Filter: Vibe không gian hẹn hò mong muốn ---
export const vibeSpaceOptions = [
  { value: "quiet_study", label: "Quán yên tĩnh, có ổ cắm để ôm laptop chạy deadline" },
  { value: "acoustic_view", label: "Quán không gian mở, có nhạc acoustic hoặc view sống ảo" },
  { value: "boardgame_lively", label: "Quán có boardgame hoặc không gian náo nhiệt để dễ phá băng" }
];

export const priorities = ["nearby", "same_interest", "same_school", "same_major", "same_cafe_style", "same_goal", "complement_personality"];

export const priorityLabels: Record<string, string> = {
  nearby: "Gần mình",
  same_interest: "Chung sở thích",
  same_school: "Cùng trường",
  same_major: "Cùng khối ngành",
  same_cafe_style: "Cùng gu cafe",
  same_goal: "Cùng mục tiêu",
  complement_personality: "Bù trừ tính cách"
};
