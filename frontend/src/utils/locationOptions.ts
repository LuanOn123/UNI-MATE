export type LocationChoice = {
  city: string;
  district: string;
  label: string;
  lat: number;
  lng: number;
};

export const locationChoices: LocationChoice[] = [
  { city: "TP.HCM", district: "Quận 1", label: "TP.HCM - Quận 1", lat: 10.7757, lng: 106.7004 },
  { city: "TP.HCM", district: "Quận 4", label: "TP.HCM - Quận 4", lat: 10.7592, lng: 106.7048 },
  { city: "TP.HCM", district: "Quận 5", label: "TP.HCM - Quận 5", lat: 10.7540, lng: 106.6635 },
  { city: "TP.HCM", district: "Quận 6", label: "TP.HCM - Quận 6", lat: 10.7465, lng: 106.6357 },
  { city: "TP.HCM", district: "Quận 7", label: "TP.HCM - Quận 7", lat: 10.7340, lng: 106.7216 },
  { city: "TP.HCM", district: "Quận 8", label: "TP.HCM - Quận 8", lat: 10.7241, lng: 106.6286 },
  { city: "TP.HCM", district: "Quận 10", label: "TP.HCM - Quận 10", lat: 10.7732, lng: 106.6679 },
  { city: "TP.HCM", district: "Quận 11", label: "TP.HCM - Quận 11", lat: 10.7629, lng: 106.6501 },
  { city: "TP.HCM", district: "Quận 12", label: "TP.HCM - Quận 12", lat: 10.8672, lng: 106.6413 },
  { city: "TP.HCM", district: "Quận 3", label: "TP.HCM - Quận 3", lat: 10.7829, lng: 106.6867 },
  { city: "TP.HCM", district: "Bình Thạnh", label: "TP.HCM - Bình Thạnh", lat: 10.8033, lng: 106.6967 },
  { city: "TP.HCM", district: "Bình Tân", label: "TP.HCM - Bình Tân", lat: 10.7653, lng: 106.6036 },
  { city: "TP.HCM", district: "Củ Chi", label: "TP.HCM - Củ Chi", lat: 10.9736, lng: 106.4934 },
  { city: "TP.HCM", district: "Gò Vấp", label: "TP.HCM - Gò Vấp", lat: 10.8380, lng: 106.6653 },
  { city: "TP.HCM", district: "Hóc Môn", label: "TP.HCM - Hóc Môn", lat: 10.8899, lng: 106.5922 },
  { city: "TP.HCM", district: "Nhà Bè", label: "TP.HCM - Nhà Bè", lat: 10.6956, lng: 106.7403 },
  { city: "TP.HCM", district: "Phú Nhuận", label: "TP.HCM - Phú Nhuận", lat: 10.7992, lng: 106.6803 },
  { city: "TP.HCM", district: "Thủ Đức", label: "TP.HCM - Thủ Đức", lat: 10.8494, lng: 106.7537 },
  { city: "TP.HCM", district: "Tân Bình", label: "TP.HCM - Tân Bình", lat: 10.8015, lng: 106.6526 },
  { city: "TP.HCM", district: "Tân Phú", label: "TP.HCM - Tân Phú", lat: 10.7916, lng: 106.6273 },
  { city: "Hà Nội", district: "Hoàn Kiếm", label: "Hà Nội - Hoàn Kiếm", lat: 21.0287, lng: 105.8524 },
  { city: "Hà Nội", district: "Ba Đình", label: "Hà Nội - Ba Đình", lat: 21.0358, lng: 105.8342 },
  { city: "Hà Nội", district: "Bắc Từ Liêm", label: "Hà Nội - Bắc Từ Liêm", lat: 21.0730, lng: 105.7703 },
  { city: "Hà Nội", district: "Cầu Giấy", label: "Hà Nội - Cầu Giấy", lat: 21.0362, lng: 105.7906 },
  { city: "Hà Nội", district: "Đống Đa", label: "Hà Nội - Đống Đa", lat: 21.0181, lng: 105.8296 },
  { city: "Hà Nội", district: "Hai Bà Trưng", label: "Hà Nội - Hai Bà Trưng", lat: 21.0069, lng: 105.8607 },
  { city: "Hà Nội", district: "Hà Đông", label: "Hà Nội - Hà Đông", lat: 20.9714, lng: 105.7788 },
  { city: "Hà Nội", district: "Hoàng Mai", label: "Hà Nội - Hoàng Mai", lat: 20.9756, lng: 105.8616 },
  { city: "Hà Nội", district: "Long Biên", label: "Hà Nội - Long Biên", lat: 21.0549, lng: 105.8883 },
  { city: "Hà Nội", district: "Nam Từ Liêm", label: "Hà Nội - Nam Từ Liêm", lat: 21.0122, lng: 105.7609 },
  { city: "Hà Nội", district: "Tây Hồ", label: "Hà Nội - Tây Hồ", lat: 21.0700, lng: 105.8194 },
  { city: "Hà Nội", district: "Thanh Xuân", label: "Hà Nội - Thanh Xuân", lat: 20.9947, lng: 105.8008 },
  { city: "Đà Nẵng", district: "Hải Châu", label: "Đà Nẵng - Hải Châu", lat: 16.0605, lng: 108.2234 },
  { city: "Đà Nẵng", district: "Cẩm Lệ", label: "Đà Nẵng - Cẩm Lệ", lat: 16.0154, lng: 108.2028 },
  { city: "Đà Nẵng", district: "Liên Chiểu", label: "Đà Nẵng - Liên Chiểu", lat: 16.0718, lng: 108.1507 },
  { city: "Đà Nẵng", district: "Ngũ Hành Sơn", label: "Đà Nẵng - Ngũ Hành Sơn", lat: 16.0036, lng: 108.2644 },
  { city: "Đà Nẵng", district: "Sơn Trà", label: "Đà Nẵng - Sơn Trà", lat: 16.1067, lng: 108.2529 },
  { city: "Đà Nẵng", district: "Thanh Khê", label: "Đà Nẵng - Thanh Khê", lat: 16.0642, lng: 108.1873 },
  { city: "Cần Thơ", district: "Ninh Kiều", label: "Cần Thơ - Ninh Kiều", lat: 10.0333, lng: 105.7833 },
  { city: "Cần Thơ", district: "Bình Thủy", label: "Cần Thơ - Bình Thủy", lat: 10.0643, lng: 105.7360 },
  { city: "Cần Thơ", district: "Cái Răng", label: "Cần Thơ - Cái Răng", lat: 9.9990, lng: 105.8049 },
  { city: "Cần Thơ", district: "Ô Môn", label: "Cần Thơ - Ô Môn", lat: 10.1097, lng: 105.6236 },
  { city: "Cần Thơ", district: "Thốt Nốt", label: "Cần Thơ - Thốt Nốt", lat: 10.2722, lng: 105.5338 },
  { city: "Hải Phòng", district: "Hồng Bàng", label: "Hải Phòng - Hồng Bàng", lat: 20.8586, lng: 106.6821 },
  { city: "Hải Phòng", district: "Lê Chân", label: "Hải Phòng - Lê Chân", lat: 20.8449, lng: 106.6756 },
  { city: "Hải Phòng", district: "Ngô Quyền", label: "Hải Phòng - Ngô Quyền", lat: 20.8561, lng: 106.7045 },
  { city: "Hải Phòng", district: "Hải An", label: "Hải Phòng - Hải An", lat: 20.8322, lng: 106.7427 },
  { city: "Hải Phòng", district: "Kiến An", label: "Hải Phòng - Kiến An", lat: 20.8077, lng: 106.6287 },
  { city: "Huế", district: "Thuận Hóa", label: "Huế - Thuận Hóa", lat: 16.4674, lng: 107.5905 },
  { city: "Huế", district: "Phú Xuân", label: "Huế - Phú Xuân", lat: 16.4826, lng: 107.5784 },
  { city: "Huế", district: "Hương Thủy", label: "Huế - Hương Thủy", lat: 16.4011, lng: 107.6474 },
  { city: "Huế", district: "Hương Trà", label: "Huế - Hương Trà", lat: 16.5259, lng: 107.4757 },
  { city: "Khánh Hòa", district: "Nha Trang", label: "Khánh Hòa - Nha Trang", lat: 12.2388, lng: 109.1967 },
  { city: "Khánh Hòa", district: "Cam Ranh", label: "Khánh Hòa - Cam Ranh", lat: 11.9136, lng: 109.1369 },
  { city: "Khánh Hòa", district: "Ninh Hòa", label: "Khánh Hòa - Ninh Hòa", lat: 12.4910, lng: 109.1251 },
  { city: "Lâm Đồng", district: "Đà Lạt", label: "Lâm Đồng - Đà Lạt", lat: 11.9404, lng: 108.4583 },
  { city: "Lâm Đồng", district: "Bảo Lộc", label: "Lâm Đồng - Bảo Lộc", lat: 11.5475, lng: 107.8077 },
  { city: "Lâm Đồng", district: "Đức Trọng", label: "Lâm Đồng - Đức Trọng", lat: 11.7356, lng: 108.3733 },
  { city: "Bình Dương", district: "Thủ Dầu Một", label: "Bình Dương - Thủ Dầu Một", lat: 10.9804, lng: 106.6519 },
  { city: "Bình Dương", district: "Dĩ An", label: "Bình Dương - Dĩ An", lat: 10.9068, lng: 106.7694 },
  { city: "Bình Dương", district: "Thuận An", label: "Bình Dương - Thuận An", lat: 10.9310, lng: 106.7115 },
  { city: "Đồng Nai", district: "Biên Hòa", label: "Đồng Nai - Biên Hòa", lat: 10.9574, lng: 106.8426 },
  { city: "Đồng Nai", district: "Long Khánh", label: "Đồng Nai - Long Khánh", lat: 10.9265, lng: 107.2431 },
  { city: "Đồng Nai", district: "Nhơn Trạch", label: "Đồng Nai - Nhơn Trạch", lat: 10.6959, lng: 106.8834 }
];

export const cities = Array.from(new Set(locationChoices.map((item) => item.city)));

export function districtsFor(city: string) {
  return locationChoices.filter((item) => item.city === city);
}

export function findLocation(label?: string) {
  return locationChoices.find((item) => item.label === label) ?? locationChoices[0];
}

export function manualLocationPayload(choice: LocationChoice) {
  return {
    lat: choice.lat,
    lng: choice.lng,
    addressLabel: choice.label,
    source: "manual" as const
  };
}
