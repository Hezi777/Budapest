"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  BedDouble,
  CalendarClock,
  CarTaxiFront,
  Check,
  Coins,
  ChevronDown,
  ChevronUp,
  Footprints,
  GripVertical,
  Map as MapIcon,
  Moon,
  Navigation,
  Pencil,
  Plus,
  Route,
  Share2,
  Snowflake,
  UtensilsCrossed,
} from "lucide-react";
import { InstallCard } from "./install-card";
import { AddStopSheet, PlaceSheet, ReservationSheet, reservationLabel, StopEditor } from "./place-sheet";
import { BudapestScene, CopyAddress, Photo, Tags } from "./ui";
import { CATEGORY_LABELS, placeIndex } from "@/lib/catalog";
import { directionsUrl, estimateLeg, mapsUrl } from "@/lib/geo";
import { HERO, HOTEL_ID } from "@/lib/places";
import { moveStop, moveStopTo, updateStop, useTrip } from "@/lib/store";
import { TRIP_INFO } from "@/lib/trip";
import type { Day, Leg, Place, Stop, Tag } from "@/lib/types";

const MONTHS = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];

const noop = () => () => {};
const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/** Today's local date on the client, null during server render. */
function useToday(): string | null {
  return useSyncExternalStore(noop, todayIso, () => null);
}

const nowHhmm = () => new Date().toTimeString().slice(0, 5);

/** The local time ("14:05") at render, null during server render. */
function useNow(): string | null {
  return useSyncExternalStore(noop, nowHhmm, () => null);
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

function countdown(today: string | null, days: Day[]): string {
  if (!today) return "4 ימים בבודפשט";
  const until = daysBetween(today, days[0].date);
  if (until > 1) return `עוד ${until} ימים לטיסה`;
  if (until === 1) return "טסים מחר!";
  const index = days.findIndex((d) => d.date === today);
  if (index >= 0) return `היום: יום ${index + 1} בטיול`;
  return today > days[days.length - 1].date ? "היה טיול מקסים" : "4 ימים בבודפשט";
}

/* ---------- Legs ---------- */

/** Wanderlog-style "directions from the last stop to this one". */
function RouteLink({ from, to, mode }: { from: Place; to?: Place; mode: "walking" | "driving" }) {
  if (!to) return null;
  return (
    <a className="route-link" href={directionsUrl(to, mode, from)} target="_blank" rel="noreferrer">
      <Route size={14} aria-hidden /> מסלול
    </a>
  );
}

function LegRow({
  leg,
  estimated,
  from,
  to,
}: {
  leg: Leg;
  estimated?: boolean;
  from: Place;
  to?: Place;
}) {
  if (leg.mode === "walk") {
    return (
      <div className="leg leg-row">
        <span className="leg-walk">
          <span className="leg-icon">
            <Footprints size={16} aria-hidden />
          </span>
          {leg.text}
          {estimated && <span className="estimate">(הערכה)</span>}
        </span>
        <RouteLink from={from} to={to} mode="walking" />
      </div>
    );
  }
  return (
    <div className="leg leg-taxi">
      <div className="leg-row">
        <span className="leg-walk">
          <span className="leg-icon">
            <CarTaxiFront size={16} aria-hidden />
          </span>
          <span>
            {leg.text}
            {estimated && <span className="estimate"> (הערכה)</span>}
          </span>
        </span>
        <RouteLink from={from} to={to} mode="driving" />
      </div>
      {leg.boltTo && <CopyAddress address={leg.boltTo} />}
    </div>
  );
}

/** The plan's own leg while it still fits, otherwise a fresh estimate. */
function resolveLeg(
  leg: Leg | undefined,
  from: Place | undefined,
  to: Place | undefined,
): { leg: Leg; estimated: boolean; from: Place; to?: Place } | undefined {
  if (!from) return undefined;
  if (leg && leg.from === from.id) return { leg, estimated: false, from, to };
  if (!to) return undefined;
  const guess = estimateLeg(from, to);
  return guess && { leg: guess, estimated: true, from, to };
}

/** Pairs every stop with how you get there. Each day starts from the hotel. */
function layoutDay(day: Day, places: Map<string, Place>, hotel: Place) {
  let prevPlace: Place | undefined = hotel;
  let number = 0;
  const rows = day.stops.map((stop, i) => {
    const place = stop.placeId ? places.get(stop.placeId) : undefined;
    // Landing at the airport has no "getting there".
    const leg = place?.category === "transport" ? undefined : resolveLeg(stop.leg, prevPlace, place);
    if (place) prevPlace = place;
    const isRest = !!stop.compact || !place;
    if (!isRest) number += 1;
    return { stop, place, leg, i, isRest, number };
  });
  const endTo = day.end?.to ? places.get(day.end.to) : undefined;
  return { rows, endLeg: resolveLeg(day.end, prevPlace, endTo) };
}

/* ---------- Stops ---------- */

function EditBar({
  day,
  stop,
  isFirst,
  isLast,
  onEdit,
  onGrab,
}: {
  day: Day;
  stop: Stop;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onGrab: (e: React.PointerEvent<HTMLElement>) => void;
}) {
  return (
    <div className="edit-bar">
      <span className="icon-btn drag-handle" role="img" aria-label="גרירה לשינוי הסדר" onPointerDown={onGrab}>
        <GripVertical size={22} />
      </span>
      <button
        type="button"
        className="icon-btn"
        aria-label="להקדים"
        disabled={isFirst}
        onClick={() => moveStop(day.id, stop.id, -1)}
      >
        <ChevronUp size={22} />
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="לאחר"
        disabled={isLast}
        onClick={() => moveStop(day.id, stop.id, 1)}
      >
        <ChevronDown size={22} />
      </button>
      <span className="spacer" />
      <button type="button" className="btn btn-primary btn-sm" onClick={onEdit}>
        <Pencil size={16} /> עריכה
      </button>
    </div>
  );
}

/** Only what decides whether to go; the rest is in the place sheet. */
const CARD_TAGS = new Set<Tag>(["kosher", "nonKosher", "booking"]);

/** An alternative, folded to its label ("חלופה כשרה") until tapped. */
function StopAlt({
  alt,
  place,
  onOpenPlace,
}: {
  alt: NonNullable<Stop["alts"]>[number];
  place?: Place;
  onOpenPlace: (place: Place) => void;
}) {
  const split = alt.text.indexOf(": ");
  const label = split > 0 ? alt.text.slice(0, split) : "חלופה";
  const body = split > 0 ? alt.text.slice(split + 2) : alt.text;
  return (
    <details className={`stop-alt${alt.kosher ? " is-kosher" : ""}`}>
      <summary>
        <UtensilsCrossed size={16} aria-hidden />
        {label}
      </summary>
      <p>{body}</p>
      {place && (
        <button type="button" className="text-link" onClick={() => onOpenPlace(place)}>
          פרטים על {place.name}
        </button>
      )}
    </details>
  );
}

function StopCard({
  day,
  stop,
  place,
  places,
  arrivesOnFoot,
  editing,
  onOpenPlace,
  onReserve,
}: {
  day: Day;
  stop: Stop;
  place: Place;
  places: Map<string, Place>;
  arrivesOnFoot: boolean;
  editing: boolean;
  onOpenPlace: (place: Place) => void;
  onReserve: () => void;
}) {
  const title = stop.title ?? place.name;

  return (
    <>
      <button type="button" className="stop-head" onClick={() => onOpenPlace(place)}>
        <span className="stop-info">
          <span className="stop-meta">
            <span>{stop.time}</span>
            <span className="sep">·</span>
            <span className="cat">{CATEGORY_LABELS[place.category]}</span>
          </span>
          <span className="stop-title">{title}</span>
          <Tags tags={place.tags?.filter((t) => CARD_TAGS.has(t))} />
        </span>
        <Photo place={place} className="stop-thumb" iconSize={28} />
      </button>
      <div className="stop-body">
        {stop.reservation && (
          <button type="button" className="resv-pill" onClick={onReserve}>
            <CalendarClock size={17} aria-hidden />
            <span>
              <span className="resv-main">{reservationLabel(stop.reservation)}</span>
              {stop.reservation.note && <span className="resv-note">{stop.reservation.note}</span>}
            </span>
          </button>
        )}
        {stop.note && <p className="stop-note">{stop.note}</p>}
        {stop.alts?.map((alt) => (
          <StopAlt
            key={alt.text}
            alt={alt}
            place={alt.placeId ? places.get(alt.placeId) : undefined}
            onOpenPlace={onOpenPlace}
          />
        ))}
        {!editing && (
          <div className="stop-actions">
            <a
              className="btn btn-soft btn-sm"
              href={arrivesOnFoot ? directionsUrl(place) : mapsUrl(place)}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={17} /> ניווט
            </a>
            {!stop.reservation && place.category !== "transport" && place.category !== "hotel" && (
              <button type="button" className="btn btn-soft btn-sm" onClick={onReserve}>
                <CalendarClock size={17} /> הזמנה
              </button>
            )}
            <button
              type="button"
              className="icon-btn done-btn"
              aria-pressed={!!stop.done}
              aria-label={stop.done ? "היינו כאן" : "סימון: היינו כאן"}
              onClick={() => updateStop(day.id, stop.id, { done: !stop.done })}
            >
              <Check size={22} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- Next up (during the trip) ---------- */

function NextUp({
  day,
  dayNumber,
  places,
  now,
  hotel,
  onOpenPlace,
}: {
  day: Day;
  dayNumber: number;
  places: Map<string, Place>;
  now: string;
  hotel: Place;
  onOpenPlace: (place: Place) => void;
}) {
  const open = day.stops.filter((s) => !s.done && !s.compact && s.placeId && places.has(s.placeId));
  // The first stop not yet ticked that hasn't started; else the last one still open.
  const stop = open.find((s) => s.time >= now) ?? open[open.length - 1];
  if (!stop) {
    return (
      <section className="card next-up" aria-label="הבא בתוכנית">
        <div className="next-kicker">יום {dayNumber}</div>
        <div className="next-title">סיימתם את כל התחנות להיום</div>
        <a className="btn btn-primary btn-block" href={directionsUrl(hotel)} target="_blank" rel="noreferrer">
          <BedDouble size={18} /> ניווט למלון
        </a>
      </section>
    );
  }
  const place = places.get(stop.placeId!)!;
  return (
    <section className="card next-up" aria-label="הבא בתוכנית">
      <button type="button" className="next-head" onClick={() => onOpenPlace(place)}>
        <Photo place={place} className="next-thumb" iconSize={26} />
        <span className="grow">
          <span className="next-kicker">
            {stop.time <= now ? "עכשיו" : "הבא בתוכנית"} · {stop.time}
          </span>
          <span className="next-title">{stop.title ?? place.name}</span>
        </span>
      </button>
      <div className="stop-actions">
        <a className="btn btn-primary" href={directionsUrl(place)} target="_blank" rel="noreferrer">
          <Navigation size={18} /> ניווט
        </a>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => updateStop(day.id, stop.id, { done: true })}
        >
          <Check size={18} /> היינו
        </button>
      </div>
    </section>
  );
}

/* ---------- Sharing ---------- */

function dayAsText(day: Day, number: number, places: Map<string, Place>): string {
  const lines = [`יום ${number} · ${day.label}`, day.title, ""];
  for (const stop of day.stops) {
    const place = stop.placeId ? places.get(stop.placeId) : undefined;
    const name = stop.title ?? place?.name ?? "";
    lines.push(`${stop.time}  ${name}${place && !stop.compact ? ` (${place.address})` : ""}`);
    if (stop.reservation) lines.push(`      ${reservationLabel(stop.reservation)}`);
    if (stop.note) lines.push(`      ${stop.note}`);
  }
  return lines.join("\n");
}

/* ---------- Drag to reorder ---------- */

type Drag = {
  stopId: string;
  from: number;
  to: number;
  items: HTMLElement[];
  mids: number[];
  shift: number;
  y0: number;
  scroll0: number;
  y: number;
  frame: number;
};

/**
 * Edit mode: grab a stop by its handle and drop it in another slot. The page
 * scrolls when the finger nears the top or bottom; other stops slide aside.
 */
function useStopDrag(dayId: string) {
  const timeline = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  function layout(d: Drag) {
    const dy = d.y - d.y0 + (window.scrollY - d.scroll0);
    const center = d.mids[d.from] + dy;
    d.to = d.mids.filter((mid, i) => i !== d.from && mid < center).length;
    d.items.forEach((el, i) => {
      if (i === d.from) {
        el.style.transform = `translateY(${dy}px)`;
        return;
      }
      const shift =
        d.from < d.to && i > d.from && i <= d.to ? -d.shift : d.from > d.to && i >= d.to && i < d.from ? d.shift : 0;
      el.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  }

  function tick() {
    const d = drag.current;
    if (!d) return;
    const edge = 90;
    const bottom = window.innerHeight - 150; // keep clear of the bottom nav
    if (d.y < edge) window.scrollBy(0, -Math.ceil((edge - d.y) / 6));
    else if (d.y > bottom) window.scrollBy(0, Math.ceil((d.y - bottom) / 6));
    layout(d);
    d.frame = requestAnimationFrame(tick);
  }

  function onGrab(e: React.PointerEvent<HTMLElement>, stopId: string, index: number) {
    const list = timeline.current;
    if (!list || drag.current) return;
    e.preventDefault();
    const items = Array.from(list.querySelectorAll<HTMLElement>(":scope > .tl-item"));
    const rects = items.map((el) => el.getBoundingClientRect());
    const gap = rects.length > 1 ? rects[1].top - rects[0].bottom : 0;
    drag.current = {
      stopId,
      from: index,
      to: index,
      items,
      mids: rects.map((r) => r.top + window.scrollY + r.height / 2),
      shift: rects[index].height + gap,
      y0: e.clientY,
      scroll0: window.scrollY,
      y: e.clientY,
      frame: 0,
    };
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    items[index].classList.add("is-dragging");
    list.classList.add("is-sorting");
    const move = (ev: PointerEvent) => {
      if (drag.current) drag.current.y = ev.clientY;
    };
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      cancelAnimationFrame(d.frame);
      list.classList.remove("is-sorting");
      d.items.forEach((el) => {
        el.classList.remove("is-dragging");
        el.style.transform = "";
      });
      if (d.to !== d.from) moveStopTo(dayId, d.stopId, d.to);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
    drag.current.frame = requestAnimationFrame(tick);
  }

  return { timeline, onGrab };
}

/* ---------- One day ---------- */

function DaySection({
  day,
  index,
  places,
  hotel,
  onOpenPlace,
  onEditStop,
  onReserve,
  onAdd,
}: {
  day: Day;
  index: number;
  places: Map<string, Place>;
  hotel: Place;
  onOpenPlace: (place: Place) => void;
  onEditStop: (stop: Stop) => void;
  onReserve: (stop: Stop) => void;
  onAdd: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { rows, endLeg } = layoutDay(day, places, hotel);
  const { timeline, onGrab } = useStopDrag(day.id);

  async function shareDay() {
    const text = dayAsText(day, index + 1, places);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Cancelled — fall through to WhatsApp.
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <section
      id={`day-${day.id}`}
      className="day-section"
      aria-labelledby={`day-${day.id}-title`}
      style={{ "--day": day.color } as React.CSSProperties}
    >
      <header className="day-card">
        <div className="page-kicker">
          יום {index + 1} · {day.label}
        </div>
        <h2 className="day-title" id={`day-${day.id}-title`}>
          {day.title}
        </h2>
        <p className="day-summary">{day.summary}</p>
        <div className="day-links">
          <button type="button" className="text-link" aria-pressed={editing} onClick={() => setEditing((v) => !v)}>
            <Pencil size={16} /> {editing ? "סיום עריכה" : "שינוי היום"}
          </button>
          <button type="button" className="text-link" onClick={shareDay}>
            <Share2 size={16} /> שליחה בוואטסאפ
          </button>
        </div>
      </header>

      {editing && (
        <div className="edit-banner" role="status">
          גוררים את הידית <GripVertical size={16} aria-hidden /> כדי לשנות סדר. „עריכה” משנה שעה, שם או יום.
        </div>
      )}

      <div className={`timeline${editing ? " is-editing" : ""}`} ref={timeline}>
        {rows.map(({ stop, place, leg, i, isRest, number }) => (
          <div key={stop.id} className="tl-item" style={{ "--i": i } as React.CSSProperties}>
            {leg && <LegRow {...leg} />}
            <div style={{ position: "relative" }}>
              <span
                className={`tl-marker${isRest ? " is-rest" : ""}${stop.done ? " is-done" : ""}`}
                aria-hidden
              >
                {isRest ? (
                  place?.id === HOTEL_ID ? <BedDouble size={15} /> : <Moon size={15} />
                ) : stop.done ? (
                  <Check size={16} />
                ) : (
                  number
                )}
              </span>
              {isRest || !place ? (
                <div className={editing ? "card" : undefined}>
                  <div className={`rest${editing ? " in-card" : ""}`}>
                    <span className="time">{stop.time}</span>
                    <span>
                      <strong>{stop.title ?? place?.name}.</strong> {stop.note}
                    </span>
                  </div>
                  {editing && (
                    <EditBar
                      day={day}
                      stop={stop}
                      isFirst={i === 0}
                      isLast={i === rows.length - 1}
                      onEdit={() => onEditStop(stop)}
                      onGrab={(e) => onGrab(e, stop.id, i)}
                    />
                  )}
                </div>
              ) : (
                <article className={`card stop${stop.done ? " is-done" : ""}`}>
                  <StopCard
                    day={day}
                    stop={stop}
                    place={place}
                    places={places}
                    arrivesOnFoot={leg?.leg.mode === "walk"}
                    editing={editing}
                    onOpenPlace={onOpenPlace}
                    onReserve={() => onReserve(stop)}
                  />
                  {editing && (
                    <EditBar
                      day={day}
                      stop={stop}
                      isFirst={i === 0}
                      isLast={i === rows.length - 1}
                      onEdit={() => onEditStop(stop)}
                      onGrab={(e) => onGrab(e, stop.id, i)}
                    />
                  )}
                </article>
              )}
            </div>
          </div>
        ))}
        {endLeg && <LegRow {...endLeg} />}
      </div>

      <button type="button" className="btn btn-outline btn-block day-add" onClick={onAdd}>
        <Plus size={20} /> הוספת עצירה ליום {index + 1}
      </button>
    </section>
  );
}

/* ---------- Which day is on screen ---------- */

/** Where the sticky day strip ends once it's stuck under the header. */
function stuckLine(strip: HTMLElement | null): number {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 0;
  return header + (strip?.offsetHeight ?? 0);
}

/**
 * Wanderlog-style: all days in one scroll. The chip of the day under the
 * sticky strip lights up; tapping a chip scrolls to that day.
 */
function useActiveDay(days: Day[]) {
  const [active, setActive] = useState(days[0].id);
  const strip = useRef<HTMLDivElement>(null);
  // While a tap-scroll glides, the tapped chip stays lit.
  const lockUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    function measure() {
      frame = 0;
      if (Date.now() < lockUntil.current) return;
      const line = stuckLine(strip.current) + 24;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = days[0].id;
      for (const d of days) {
        const el = document.getElementById(`day-${d.id}`);
        if (el && el.getBoundingClientRect().top <= line) current = d.id;
      }
      // The last day may be too short to ever reach the strip.
      setActive(atBottom ? days[days.length - 1].id : current);
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    frame = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [days]);

  function jump(id: string) {
    const el = document.getElementById(`day-${id}`);
    if (!el) return;
    setActive(id);
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    lockUntil.current = Date.now() + (smooth ? 900 : 100);
    const top = el.getBoundingClientRect().top + window.scrollY - stuckLine(strip.current) - 8;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  }

  return { active, jump, strip };
}

/* ---------- Page ---------- */

export function PlanView() {
  const trip = useTrip();
  const today = useToday();
  const now = useNow();
  const places = useMemo(() => placeIndex(trip), [trip]);
  const hotel = places.get(HOTEL_ID)!;
  const todayIndex = trip.days.findIndex((d) => d.date === today);
  const { active, jump, strip } = useActiveDay(trip.days);
  const [openPlace, setOpenPlace] = useState<Place | null>(null);
  // Stops are kept as they were when the sheet opened; days are looked up fresh.
  const [editStop, setEditStop] = useState<{ dayId: string; stop: Stop } | null>(null);
  const [reserve, setReserve] = useState<{ dayId: string; stop: Stop } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const dayById = (id: string) => trip.days.find((d) => d.id === id);
  const editDay = editStop && dayById(editStop.dayId);
  const reserveDay = reserve && dayById(reserve.dayId);
  const addDay = adding && dayById(adding);

  return (
    <div>
      <section className="hero" aria-label="הטיול">
        <BudapestScene className="hero-art" />
        <Photo place={HERO} width={960} iconSize={0} />
        <div className="hero-text">
          <div className="hero-dates">{countdown(today, trip.days)}</div>
          <h1 className="hero-title">{TRIP_INFO.title}</h1>
          <div className="hero-meta">
            <span>{TRIP_INFO.dates}</span>
            <span className="glass-pill">
              <Snowflake size={14} aria-hidden /> 0–7°
            </span>
          </div>
        </div>
      </section>

      {todayIndex >= 0 && now && (
        <NextUp
          day={trip.days[todayIndex]}
          dayNumber={todayIndex + 1}
          places={places}
          now={now}
          hotel={hotel}
          onOpenPlace={setOpenPlace}
        />
      )}

      <nav className="quick-grid" aria-label="קיצורים">
        <a className="quick" href={directionsUrl(hotel)} target="_blank" rel="noreferrer">
          <span className="q-icon">
            <BedDouble size={22} aria-hidden />
          </span>
          חזרה למלון
        </a>
        <Link className="quick" href={`/map?day=${active}`}>
          <span className="q-icon">
            <MapIcon size={22} aria-hidden />
          </span>
          מפת היום
        </Link>
        <Link className="quick" href="/money">
          <span className="q-icon">
            <Coins size={22} aria-hidden />
          </span>
          המרת כסף
        </Link>
      </nav>

      <h2 className="section-title">התוכנית</h2>
      <div className="day-strip" role="group" aria-label="מעבר ליום" ref={strip}>
        {trip.days.map((d) => {
          const [, month, date] = d.date.split("-").map(Number);
          return (
            <button
              key={d.id}
              type="button"
              className="day-chip"
              style={{ "--chip": d.color } as React.CSSProperties}
              aria-pressed={d.id === active}
              onClick={() => jump(d.id)}
            >
              <span className="d-week">{d.label.split(" · ")[0]}</span>
              <span className="d-num">{date}</span>
              <span className="d-month">{MONTHS[month - 1]}</span>
            </button>
          );
        })}
      </div>

      {trip.days.map((d, index) => (
        <DaySection
          key={d.id}
          day={d}
          index={index}
          places={places}
          hotel={hotel}
          onOpenPlace={setOpenPlace}
          onEditStop={(stop) => setEditStop({ dayId: d.id, stop })}
          onReserve={(stop) => setReserve({ dayId: d.id, stop })}
          onAdd={() => setAdding(d.id)}
        />
      ))}

      <div style={{ marginBlockStart: 28 }}>
        <InstallCard />
      </div>

      {openPlace && <PlaceSheet place={openPlace} defaultDayId={active} onClose={() => setOpenPlace(null)} />}
      {editStop && editDay && (
        <StopEditor
          day={editDay}
          stop={editStop.stop}
          place={editStop.stop.placeId ? places.get(editStop.stop.placeId) : undefined}
          onClose={() => setEditStop(null)}
        />
      )}
      {reserve && reserveDay && (
        <ReservationSheet
          day={reserveDay}
          stop={reserve.stop}
          place={reserve.stop.placeId ? places.get(reserve.stop.placeId) : undefined}
          onClose={() => setReserve(null)}
        />
      )}
      {addDay && <AddStopSheet day={addDay} onClose={() => setAdding(null)} />}
    </div>
  );
}
