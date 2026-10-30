"use client";

import { useSyncExternalStore } from "react";
import { seedTrip, TRIP_VERSION } from "./trip";
import type { Day, Place, Stop, Trip } from "./types";

/**
 * The trip lives in localStorage so every change Edna and Benny make stays on
 * their phone. A tiny external store keeps every screen in sync.
 */
function createStore<T>(key: string, fallback: T, isValid: (v: unknown) => v is T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  function read(): T {
    if (cache !== undefined) return cache;
    cache = fallback;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) cache = parsed;
      }
    } catch {
      // Private mode or corrupt data — fall back to the default.
    }
    return cache;
  }

  function write(next: T) {
    cache = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage full or blocked: the change still applies for this visit.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      cache = undefined;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function use(): T {
    return useSyncExternalStore(subscribe, read, () => fallback);
  }

  return { read, write, use };
}

/* ---------- Trip ---------- */

const SEED = seedTrip();

const tripStore = createStore<Trip>(
  "budapest-trip",
  SEED,
  (v): v is Trip =>
    typeof v === "object" &&
    v !== null &&
    (v as Trip).version === TRIP_VERSION &&
    Array.isArray((v as Trip).days),
);

export const useTrip = tripStore.use;

function update(fn: (trip: Trip) => Trip) {
  tripStore.write(fn(tripStore.read()));
}

function byTime(a: Stop, b: Stop) {
  return a.time.localeCompare(b.time);
}

function mapDay(trip: Trip, dayId: string, fn: (day: Day) => Day): Trip {
  return { ...trip, days: trip.days.map((d) => (d.id === dayId ? fn(d) : d)) };
}

export function updateStop(dayId: string, stopId: string, patch: Partial<Stop>) {
  update((trip) =>
    mapDay(trip, dayId, (day) => ({
      ...day,
      stops: day.stops
        .map((s) => (s.id === stopId ? { ...s, ...patch } : s))
        .sort(byTime),
    })),
  );
}

export function removeStop(dayId: string, stopId: string) {
  update((trip) =>
    mapDay(trip, dayId, (day) => ({
      ...day,
      stops: day.stops.filter((s) => s.id !== stopId),
    })),
  );
}

export function addStop(dayId: string, stop: Omit<Stop, "id">) {
  const id = `s${Date.now().toString(36)}`;
  update((trip) =>
    mapDay(trip, dayId, (day) => ({
      ...day,
      stops: [...day.stops, { ...stop, id }].sort(byTime),
    })),
  );
}

/** Swap a stop with its neighbour, swapping their times so the order holds. */
export function moveStop(dayId: string, stopId: string, direction: -1 | 1) {
  update((trip) =>
    mapDay(trip, dayId, (day) => {
      const stops = [...day.stops];
      const i = stops.findIndex((s) => s.id === stopId);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= stops.length) return day;
      const a = stops[i];
      const b = stops[j];
      stops[i] = { ...b, time: a.time };
      stops[j] = { ...a, time: b.time };
      return { ...day, stops };
    }),
  );
}

/** Drag-and-drop: the stop moves to another slot; every slot keeps its time. */
export function moveStopTo(dayId: string, stopId: string, toIndex: number) {
  update((trip) =>
    mapDay(trip, dayId, (day) => {
      const from = day.stops.findIndex((s) => s.id === stopId);
      const to = Math.max(0, Math.min(day.stops.length - 1, toIndex));
      if (from < 0 || from === to) return day;
      const times = day.stops.map((s) => s.time);
      const order = [...day.stops];
      const [moved] = order.splice(from, 1);
      order.splice(to, 0, moved);
      return { ...day, stops: order.map((s, i) => ({ ...s, time: times[i] })) };
    }),
  );
}

export function moveStopToDay(fromDayId: string, stopId: string, toDayId: string) {
  update((trip) => {
    const stop = trip.days
      .find((d) => d.id === fromDayId)
      ?.stops.find((s) => s.id === stopId);
    if (!stop || fromDayId === toDayId) return trip;
    return {
      ...trip,
      days: trip.days.map((d) => {
        if (d.id === fromDayId) return { ...d, stops: d.stops.filter((s) => s.id !== stopId) };
        if (d.id === toDayId) return { ...d, stops: [...d.stops, stop].sort(byTime) };
        return d;
      }),
    };
  });
}

export function addCustomPlace(place: Place) {
  update((trip) => ({ ...trip, customPlaces: [...trip.customPlaces, place] }));
}

export function resetTrip() {
  tripStore.write(seedTrip());
}

/* ---------- Settings ---------- */

export type TextSize = "normal" | "large" | "xlarge";

export type Settings = {
  textSize: TextSize;
  /** The day tab picked, remembered for the rest of that date. */
  dayPick?: { id: string; on: string };
  /** Last rate we fetched, so the converter works offline. */
  rate?: { value: number; date: string };
  /** The first-visit welcome was dismissed. */
  welcomed?: boolean;
  /** Ids of the items ticked on the pre-flight packing list (see packing-list.tsx). */
  packed?: string[];
};

const settingsStore = createStore<Settings>(
  "budapest-settings",
  { textSize: "normal" },
  (v): v is Settings => typeof v === "object" && v !== null && "textSize" in v,
);

export const useSettings = settingsStore.use;

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.write({ ...settingsStore.read(), ...patch });
}
