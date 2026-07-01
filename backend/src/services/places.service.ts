import { env } from "../config/env.js";
import { PlaceCache } from "../models/PlaceCache.js";
import { User } from "../models/User.js";

export function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export async function suggestCafePlaces(userIds: string[]) {
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const coords = users.map((u) => u.location?.coordinates).filter(Boolean) as [number, number][];
  const center = coords.length === 2 ? midpoint(coords[0], coords[1]) : ([106.7009, 10.7769] as [number, number]);

  if (env.GOOGLE_MAPS_API_KEY) {
    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    url.searchParams.set("location", `${center[1]},${center[0]}`);
    url.searchParams.set("radius", "2500");
    url.searchParams.set("type", "cafe");
    url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);
    const response = await fetch(url);
    const data: any = await response.json();
    if (Array.isArray(data.results) && data.results.length > 0) {
      const places = await Promise.all(
        data.results.slice(0, 3).map((p: any) =>
          PlaceCache.findOneAndUpdate(
            { googlePlaceId: p.place_id },
            {
              googlePlaceId: p.place_id,
              name: p.name,
              address: p.vicinity,
              rating: p.rating,
              userRatingsTotal: p.user_ratings_total,
              status: "active",
              showWithoutRating: !p.rating,
              openNow: p.opening_hours?.open_now,
              mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
              location: { type: "Point", coordinates: [p.geometry.location.lng, p.geometry.location.lat] }
            },
            { upsert: true, new: true }
          )
        )
      );
      return places;
    }
  }

  try {
    const cached = await PlaceCache.find({
      status: "active",
      $or: [{ rating: { $gte: 3.5 } }, { showWithoutRating: true }, { rating: { $exists: false } }],
      location: { $near: { $geometry: { type: "Point", coordinates: center }, $maxDistance: 5000 } }
    }).limit(3);
    if (cached.length) return cached;
  } catch {
    // Fall through to the plain active-place query. Demo data may not always have a usable geo index yet.
  }

  const activePlaces = await PlaceCache.find({ status: "active" }).sort({ rating: -1, updatedAt: -1 }).limit(3);
  if (activePlaces.length) return activePlaces;

  return PlaceCache.insertMany([
    { name: "UNI Brew Study", address: "Gan trung diem cua hai ban", city: "TP.HCM", rating: 4.6, userRatingsTotal: 128, status: "active", tags: ["study", "wifi", "quiet"], amenities: ["wifi", "power"], openNow: true, mapsUrl: "https://maps.google.com", location: { type: "Point", coordinates: center } },
    { name: "Milk Coffee Corner", address: "Quan yen tinh de tro chuyen", city: "TP.HCM", rating: 4.5, userRatingsTotal: 94, status: "active", tags: ["chill", "quiet"], amenities: ["wifi"], openNow: true, mapsUrl: "https://maps.google.com", location: { type: "Point", coordinates: [center[0] + 0.004, center[1] + 0.002] } },
    { name: "Campus Beans", address: "Wifi manh, co o cam", city: "TP.HCM", rating: 4.4, userRatingsTotal: 76, status: "active", tags: ["study", "power"], amenities: ["wifi", "power"], openNow: false, mapsUrl: "https://maps.google.com", location: { type: "Point", coordinates: [center[0] - 0.003, center[1] - 0.002] } }
  ]);
}
