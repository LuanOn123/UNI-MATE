import { env } from "../config/env.js";

export type LngLat = [number, number];

export type OsrmTableElement = {
  originIndex: number;
  destinationIndex: number;
  distanceMeters?: number;
  durationSeconds?: number;
};

function serviceError(message: string, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function formatCoordinate([lng, lat]: LngLat) {
  return `${lng},${lat}`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function computeOsrmTable(origin: LngLat, destinations: LngLat[]): Promise<OsrmTableElement[]> {
  if (!destinations.length) return [];

  const coordinates = [origin, ...destinations].map(formatCoordinate).join(";");
  const destinationIndexes = destinations.map((_, index) => index + 1);
  const baseUrl = env.OSRM_BASE_URL.replace(/\/+$/, "");
  const profile = encodeURIComponent(env.OSRM_PROFILE);
  const url = new URL(`${baseUrl}/table/v1/${profile}/${coordinates}`);
  url.searchParams.set("sources", "0");
  url.searchParams.set("destinations", destinationIndexes.join(";"));
  url.searchParams.set("annotations", "duration,distance");

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("OSRM Table request failed", { status: response.status, body: body.slice(0, 500) });
    throw serviceError("OSRM request failed while calculating travel distance.", 502);
  }

  const data: any = await response.json();
  if (data?.code !== "Ok") {
    console.error("OSRM Table returned a non-Ok response", { code: data?.code, message: data?.message });
    throw serviceError("OSRM could not calculate route distance.", 502);
  }

  const durations = Array.isArray(data.durations?.[0]) ? data.durations[0] : [];
  const distances = Array.isArray(data.distances?.[0]) ? data.distances[0] : [];

  return destinations.map((_, index) => ({
    originIndex: 0,
    destinationIndex: index,
    durationSeconds: isFiniteNumber(durations[index]) ? durations[index] : undefined,
    distanceMeters: isFiniteNumber(distances[index]) ? distances[index] : undefined
  }));
}
