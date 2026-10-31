"use client";

import { useSyncExternalStore } from "react";
import { applySyncedTrip, onLocalTripEdit, readTrip } from "./store";
import { seedTrip, TRIP_VERSION } from "./trip";
import type { Day, Stop, Trip } from "./types";

/**
 * Keeps both phones on one plan through /api/trip. The plan still lives in
 * localStorage, so the app works offline; edits go up when there's internet
 * and the other phone's edits come down every half minute while the app is
 * open. If both changed the plan in between, the two are merged stop by stop.
 */

type SyncState = {
  /** The server revision this phone last saw. */
  rev: number;
  /** The plan as of `rev` — the common ancestor for a merge. */
  base: Trip | null;
  /** This phone has edits the server hasn't got yet. */
  dirty: boolean;
};

export type SyncStatus = "off" | "synced" | "pending" | "offline";

const KEY = "budapest-sync";
const PULL_EVERY = 30_000;

let state: SyncState = { rev: 0, base: null, dirty: false };
let status: SyncStatus = "off";
let lastSynced: number | null = null;
const statusListeners = new Set<() => void>();
/** Bumped on every local edit, so a save that raced an edit stays dirty. */
let editCount = 0;
let busy: Promise<void> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | undefined;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, ...(JSON.parse(raw) as SyncState) };
  } catch {
    // Corrupt or blocked: start fresh; the server copy wins.
  }
}

function save(next: Partial<SyncState>) {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full: sync still works for this visit.
  }
}

function setStatus(next: SyncStatus) {
  if (next === "synced") lastSynced = Date.now();
  if (next === status && next !== "synced") return;
  status = next;
  statusListeners.forEach((l) => l());
}

/* ---------- Merge ---------- */

type Placed = { dayId: string; stop: Stop };

function stopsById(trip: Trip | null): Map<string, Placed> {
  const map = new Map<string, Placed>();
  trip?.days.forEach((day) => day.stops.forEach((stop) => map.set(stop.id, { dayId: day.id, stop })));
  return map;
}

const same = (a: Placed | undefined, b: Placed | undefined) =>
  !!a && !!b && a.dayId === b.dayId && JSON.stringify(a.stop) === JSON.stringify(b.stop);

/**
 * Three-way merge of two edited plans. A stop changed (or moved, or deleted)
 * on one phone only takes that phone's version; changed on both, the other
 * phone's wins. New stops from either side are kept.
 */
export function mergeTrips(base: Trip | null, mine: Trip, theirs: Trip): Trip {
  const b = stopsById(base);
  const m = stopsById(mine);
  const t = stopsById(theirs);
  const kept: Placed[] = [];
  for (const id of new Set([...t.keys(), ...m.keys(), ...b.keys()])) {
    const was = b.get(id);
    const my = m.get(id);
    const their = t.get(id);
    if (!was) {
      const pick = their ?? my;
      if (pick) kept.push(pick);
      continue;
    }
    const iChanged = !same(my, was);
    const theyChanged = !same(their, was);
    if (!my && !their) continue;
    if (!my) {
      if (theyChanged && their) kept.push(their);
      continue;
    }
    if (!their) {
      if (iChanged) kept.push(my);
      continue;
    }
    kept.push(iChanged && !theyChanged ? my : their);
  }
  const days: Day[] = theirs.days.map((day) => ({
    ...day,
    stops: kept
      .filter((p) => p.dayId === day.id)
      .map((p) => p.stop)
      .sort((x, y) => x.time.localeCompare(y.time)),
  }));
  const places = new Map(theirs.customPlaces.map((p) => [p.id, p]));
  mine.customPlaces.forEach((p) => places.has(p.id) || places.set(p.id, p));
  return { ...theirs, days, customPlaces: [...places.values()] };
}

/* ---------- Talking to the server ---------- */

type Remote = { rev: number; trip: Trip | null };

const usable = (trip: Trip | null): trip is Trip => !!trip && trip.version === TRIP_VERSION;

async function push(): Promise<void> {
  if (!state.dirty) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    const trip = readTrip();
    const edits = editCount;
    const res = await fetch("/api/trip", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseRev: state.rev, trip }),
    });
    if (res.status === 503) return setStatus("off");
    if (res.ok) {
      const { rev } = (await res.json()) as { rev: number };
      save({ rev, base: trip, dirty: editCount !== edits });
      if (!state.dirty) return setStatus("synced");
      continue;
    }
    if (res.status === 409) {
      const remote = (await res.json()) as Remote;
      if (usable(remote.trip)) {
        applySyncedTrip(mergeTrips(state.base, trip, remote.trip));
        save({ rev: remote.rev, base: remote.trip });
      } else {
        // An older or newer app version saved last: replace it with ours.
        save({ rev: remote.rev });
      }
      continue;
    }
    throw new Error(`save ${res.status}`);
  }
}

async function pull(): Promise<void> {
  const res = await fetch("/api/trip", { cache: "no-store" });
  if (res.status === 503) return setStatus("off");
  if (!res.ok) throw new Error(`load ${res.status}`);
  const remote = (await res.json()) as Remote;
  if (!remote.trip || remote.rev < state.rev) {
    // Nothing on the server yet (or it was reset): this phone seeds it.
    save({ rev: remote.rev, dirty: true });
  } else if (remote.trip.version !== TRIP_VERSION) {
    // The plan's shape changed in a new app version. An older copy is replaced
    // by ours; a newer one is left alone until this phone updates.
    if (remote.trip.version < TRIP_VERSION) save({ rev: remote.rev, dirty: true });
  } else if (remote.rev !== state.rev || !state.base) {
    const mine = readTrip();
    // First sync on this phone: both phones started from the seed plan, so it
    // is the common ancestor; edits made here before syncing aren't lost.
    const next =
      state.dirty || !state.base ? mergeTrips(state.base ?? seedTrip(), mine, remote.trip) : remote.trip;
    const changed = JSON.stringify(next) !== JSON.stringify(mine);
    applySyncedTrip(next);
    save({ rev: remote.rev, base: remote.trip, dirty: JSON.stringify(next) !== JSON.stringify(remote.trip) });
    if (changed) window.dispatchEvent(new Event("trip-synced-in"));
  }
  await push();
  if (!state.dirty) setStatus("synced");
}

/** One sync at a time; failures just mean "try again later". */
function run(job: () => Promise<void>) {
  if (busy) return busy;
  busy = job()
    .catch(() => setStatus(state.dirty ? "offline" : status === "off" ? "off" : "offline"))
    .finally(() => {
      busy = null;
    });
  return busy;
}

/** Starts syncing; returns a stop function. Call once, from the app shell. */
export function startSync(): () => void {
  load();
  const sync = () => run(pull);
  const unsubscribe = onLocalTripEdit(() => {
    editCount++;
    save({ dirty: true });
    if (status !== "off") setStatus("pending");
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => run(push), 800);
  });
  const onVisible = () => document.visibilityState === "visible" && sync();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", sync);
  const timer = setInterval(() => document.visibilityState === "visible" && sync(), PULL_EVERY);
  sync();
  return () => {
    unsubscribe();
    clearInterval(timer);
    clearTimeout(pushTimer);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", sync);
  };
}

/* ---------- Status for the UI ---------- */

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function useSyncStatus(): { status: SyncStatus; lastSynced: number | null } {
  const current = useSyncExternalStore(
    subscribeStatus,
    () => status,
    () => "off" as SyncStatus,
  );
  return { status: current, lastSynced };
}
