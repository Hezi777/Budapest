export type Category =
  | "sight"
  | "food"
  | "cafe"
  | "market"
  | "shopping"
  | "bath"
  | "jewish"
  | "experience"
  | "hotel"
  | "transport";

export type Tag =
  | "kosher"
  | "meat"
  | "dairy"
  | "dairyOptions"
  | "nonKosher"
  | "booking"
  | "free"
  | "christmas"
  | "optional"
  | "grocery";

/** Where a place's photo comes from — resolved live by /api/photo. */
export type PhotoSource = {
  /** Exact Wikipedia article title. */
  wiki?: string;
  /** Wikipedia language edition, defaults to "en". */
  lang?: "en" | "hu" | "he";
  /** Free-text Wikimedia Commons search, used when there is no article. */
  commons?: string;
  /** Text query for Google Places, used only when a key is configured. */
  google?: string;
};

export type Place = {
  id: string;
  /** Hebrew display name. */
  name: string;
  /** Local / English name, also used for the navigation search. */
  local: string;
  address: string;
  lat: number;
  lng: number;
  category: Category;
  description: string;
  tags?: Tag[];
  photo?: PhotoSource;
  website?: string;
  phone?: string;
  hours?: string;
  /** Typical visit length, free text. */
  duration?: string;
  price?: string;
  /** Why it's worth it — e.g. "trending on TikTok". */
  why?: string;
};

export type LegMode = "walk" | "taxi";

/** How you get to a stop from the one before it. */
export type Leg = {
  mode: LegMode;
  text: string;
  /** Place id this leg starts from. If the stop before is different, the leg is stale and gets re-estimated. */
  from?: string;
  /** Place id the leg ends at — only needed for a day's closing leg. */
  to?: string;
  /** Destination to type into Bolt. */
  boltTo?: string;
};

export type Stop = {
  id: string;
  time: string;
  /** A catalogued place. A stop without one is a free-text note (rest, check-out…). */
  placeId?: string;
  /** Overrides the place name, or names a note. */
  title?: string;
  note?: string;
  leg?: Leg;
  /** A quieter row instead of a full card — rest at the hotel, check-out. */
  compact?: boolean;
  /** Fallback suggestions shown under the card. */
  alts?: { placeId?: string; text: string; kosher?: boolean }[];
  done?: boolean;
};

export type Day = {
  id: string;
  date: string;
  /** e.g. "חמישי · 26 בנובמבר" */
  label: string;
  title: string;
  summary: string;
  color: string;
  stops: Stop[];
  /** How the day ends — usually the way back to the hotel. */
  end?: Leg;
};

export type Trip = {
  version: number;
  days: Day[];
  /** Places the user added themselves. */
  customPlaces: Place[];
};
