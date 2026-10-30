import { IDEAS } from "./ideas";
import { KOSHER_PLACES, PLAN_PLACES } from "./places";
import type { Category, Place, Tag, Trip } from "./types";

const BUILT_IN: Place[] = [...PLAN_PLACES, ...KOSHER_PLACES, ...IDEAS];

export function allPlaces(trip: Trip): Place[] {
  return [...BUILT_IN, ...trip.customPlaces];
}

/**
 * Places merged into another entry. Phones may still have them in a saved
 * plan, so the old id keeps resolving to the place it was merged into.
 */
const MERGED: Record<string, string> = {
  "basilica-dome": "basilica",
  "city-park-rink": "heroes-square",
  "tt-pichler": "chimney-cake",
};

export function placeIndex(trip: Trip): Map<string, Place> {
  const index = new Map(allPlaces(trip).map((p) => [p.id, p]));
  for (const [from, to] of Object.entries(MERGED)) {
    const place = index.get(to);
    if (place && !index.has(from)) index.set(from, place);
  }
  return index;
}

/** Ids of every place already scheduled somewhere in the trip. */
export function plannedIds(trip: Trip): Set<string> {
  return new Set(
    trip.days.flatMap((d) =>
      d.stops.map((s) => s.placeId && (MERGED[s.placeId] ?? s.placeId)).filter((id): id is string => !!id),
    ),
  );
}

export const TAG_LABELS: Record<Tag, string> = {
  kosher: "כשר",
  meat: "בשרי",
  dairy: "חלבי",
  dairyOptions: "יש מנות חלביות",
  nonKosher: "לא כשר",
  booking: "להזמין מראש",
  free: "חינם",
  christmas: "כריסמס",
  optional: "אופציונלי",
  grocery: "מכולת",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  sight: "אתרים ונוף",
  food: "מסעדות",
  cafe: "קפה וקינוחים",
  market: "שווקים",
  shopping: "קניות",
  bath: "מרחצאות",
  jewish: "מורשת יהודית",
  experience: "חוויות",
  hotel: "מלון",
  transport: "תחבורה",
};

export function isKosher(place: Place): boolean {
  return place.tags?.includes("kosher") ?? false;
}
