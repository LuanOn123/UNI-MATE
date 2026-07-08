import type { LngLat } from "./osrm.service.js";

export function calculateDistanceScore(durationSeconds: number | undefined, t50 = 15, tMax = 45) {
  const minutes = typeof durationSeconds === "number" ? durationSeconds / 60 : Number.NaN;
  if (!Number.isFinite(minutes) || minutes > tMax) return 0;
  return Number((100 * Math.exp(-Math.log(2) * (minutes / t50))).toFixed(1));
}

export function calibrateUrbanDurationSeconds(durationSeconds: number | undefined, distanceMeters: number | undefined, citySpeedKmh = 25) {
  const osrmSeconds = typeof durationSeconds === "number" && Number.isFinite(durationSeconds) ? durationSeconds : undefined;
  const speedMetersPerSecond = citySpeedKmh > 0 ? (citySpeedKmh * 1000) / 3600 : 0;
  const citySpeedSeconds =
    typeof distanceMeters === "number" && Number.isFinite(distanceMeters) && speedMetersPerSecond > 0
      ? distanceMeters / speedMetersPerSecond
      : undefined;

  if (osrmSeconds === undefined) return citySpeedSeconds;
  if (citySpeedSeconds === undefined) return osrmSeconds;
  return Math.max(osrmSeconds, citySpeedSeconds);
}

export function haversineMeters(coordsA: LngLat, coordsB: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lngA, latA] = coordsA;
  const [lngB, latB] = coordsB;
  const dLat = toRad(latB - latA);
  const dLng = toRad(lngB - lngA);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateRDR(roadDistanceMeters: number | undefined, haversineDistanceMeters: number, epsilon = 1) {
  if (!Number.isFinite(roadDistanceMeters)) return null;
  const ratio = Number(roadDistanceMeters) / Math.max(haversineDistanceMeters, epsilon);
  return Number.isFinite(ratio) ? Number(ratio.toFixed(2)) : null;
}
