import type { Leg, Place } from "./types";

/** Great-circle distance in kilometres. */
export function distanceKm(a: Place, b: Place): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Streets are never straight — scale the crow-flies distance up a bit. */
const DETOUR = 1.3;
const WALK_KMH = 4.2;
const TAXI_KMH = 22;
const MAX_WALK_MIN = 20;

/** A rough leg between two places, used when the plan has none or it went stale. */
export function estimateLeg(from: Place, to: Place): Leg | undefined {
  if (from.id === to.id) return undefined;
  const km = distanceKm(from, to) * DETOUR;
  const walkMin = Math.max(2, Math.round((km / WALK_KMH) * 60));
  if (walkMin <= MAX_WALK_MIN) {
    return { mode: "walk", text: `כ־${walkMin} דק' הליכה`, from: from.id };
  }
  const taxiMin = Math.max(5, Math.round((km / TAXI_KMH) * 60) + 3);
  return {
    mode: "taxi",
    text: `מונית · כ־${taxiMin} דק'`,
    from: from.id,
    boltTo: to.address,
  };
}

function query(place: Place): string {
  return place.address.includes(place.local)
    ? place.address
    : `${place.local}, ${place.address}`;
}

/** Google Maps directions to a place; from where you stand unless `from` is given. */
export function directionsUrl(
  place: Place,
  mode: "walking" | "driving" = "walking",
  from?: Place,
): string {
  const params = new URLSearchParams({
    api: "1",
    destination: query(place),
    travelmode: mode,
  });
  if (from) params.set("origin", query(from));
  return `https://www.google.com/maps/dir/?${params}`;
}

export function mapsUrl(place: Place): string {
  const params = new URLSearchParams({ api: "1", query: query(place) });
  return `https://www.google.com/maps/search/?${params}`;
}

export function photoUrl(place: Place, width: 500 | 960 | 1280 = 500): string | undefined {
  const photo = place.photo;
  if (!photo) return undefined;
  const params = new URLSearchParams({ w: String(width) });
  if (photo.wiki) params.set("wiki", photo.wiki);
  if (photo.lang) params.set("lang", photo.lang);
  if (photo.commons) params.set("commons", photo.commons);
  if (photo.google) params.set("google", photo.google);
  return `/api/photo?${params}`;
}
