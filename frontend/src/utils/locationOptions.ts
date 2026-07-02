export type LocationChoice = {
  city: string;
  district: string;
  label: string;
  lat: number;
  lng: number;
};

export const locationChoices: LocationChoice[] = [
  { city: "TP.HCM", district: "Quận 1", label: "TP.HCM - Quận 1", lat: 10.7757, lng: 106.7004 },
  { city: "TP.HCM", district: "Quận 3", label: "TP.HCM - Quận 3", lat: 10.7829, lng: 106.6867 },
  { city: "TP.HCM", district: "Bình Thạnh", label: "TP.HCM - Bình Thạnh", lat: 10.8033, lng: 106.6967 },
  { city: "TP.HCM", district: "Thủ Đức", label: "TP.HCM - Thủ Đức", lat: 10.8494, lng: 106.7537 },
  { city: "TP.HCM", district: "Tân Bình", label: "TP.HCM - Tân Bình", lat: 10.8015, lng: 106.6526 },
  { city: "Hà Nội", district: "Hoàn Kiếm", label: "Hà Nội - Hoàn Kiếm", lat: 21.0287, lng: 105.8524 },
  { city: "Hà Nội", district: "Cầu Giấy", label: "Hà Nội - Cầu Giấy", lat: 21.0362, lng: 105.7906 },
  { city: "Hà Nội", district: "Đống Đa", label: "Hà Nội - Đống Đa", lat: 21.0181, lng: 105.8296 },
  { city: "Đà Nẵng", district: "Hải Châu", label: "Đà Nẵng - Hải Châu", lat: 16.0605, lng: 108.2234 },
  { city: "Đà Nẵng", district: "Ngũ Hành Sơn", label: "Đà Nẵng - Ngũ Hành Sơn", lat: 16.0036, lng: 108.2644 }
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
