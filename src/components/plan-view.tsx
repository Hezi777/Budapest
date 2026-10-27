"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  BedDouble,
  CarTaxiFront,
  Check,
  ChevronDown,
  ChevronUp,
  Footprints,
  Map as MapIcon,
  Moon,
  Navigation,
  Pencil,
  Phone,
  Plus,
  Share2,
  Siren,
  Snowflake,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import { AddStopSheet, PlaceSheet, StopEditor } from "./place-sheet";
import { BudapestScene, CopyAddress, Photo, Tags } from "./ui";
import { CATEGORY_LABELS, placeIndex } from "@/lib/catalog";
import { directionsUrl, estimateLeg, mapsUrl } from "@/lib/geo";
import { HOTEL_ID } from "@/lib/places";
import { moveStop, updateSettings, updateStop, useSettings, useTrip } from "@/lib/store";
import { TRIP_INFO } from "@/lib/trip";
import type { Day, Leg, Place, Stop } from "@/lib/types";

const HERO: Place = {
  id: "hero",
  name: "בודפשט",
  local: "Budapest",
  address: "Budapest",
  lat: 0,
  lng: 0,
  category: "sight",
  description: "",
  photo: { wiki: "Hungarian Parliament Building" },
};

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

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

function countdown(today: string | null, days: Day[]): string {
  if (!today) return TRIP_INFO.dates;
  const until = daysBetween(today, days[0].date);
  if (until > 1) return `עוד ${until} ימים לטיסה`;
  if (until === 1) return "טסים מחר!";
  const index = days.findIndex((d) => d.date === today);
  if (index >= 0) return `היום: יום ${index + 1} בטיול`;
  return today > days[days.length - 1].date ? "היה טיול מקסים" : TRIP_INFO.dates;
}

/* ---------- Legs ---------- */

function LegRow({ leg, estimated }: { leg: Leg; estimated?: boolean }) {
  if (leg.mode === "walk") {
    return (
      <div className="leg">
        <span className="leg-walk">
          <span className="leg-icon">
            <Footprints size={16} aria-hidden />
          </span>
          {leg.text}
          {estimated && <span className="estimate">(הערכה)</span>}
        </span>
      </div>
    );
  }
  return (
    <div className="leg">
      <div className="leg-taxi">
        <div className="leg-taxi-top">
          <span className="leg-icon">
            <CarTaxiFront size={16} aria-hidden />
          </span>
          <span>
            {leg.text}
            {estimated && <span className="estimate"> (הערכה)</span>}
          </span>
        </div>
        {leg.boltTo && <CopyAddress address={leg.boltTo} />}
      </div>
    </div>
  );
}

/** The plan's own leg while it still fits, otherwise a fresh estimate. */
function resolveLeg(
  leg: Leg | undefined,
  from: Place | undefined,
  to: Place | undefined,
): { leg: Leg; estimated: boolean } | undefined {
  if (!from) return undefined;
  if (leg && leg.from === from.id) return { leg, estimated: false };
  if (!to) return undefined;
  const guess = estimateLeg(from, to);
  return guess && { leg: guess, estimated: true };
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
}: {
  day: Day;
  stop: Stop;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="edit-bar">
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
      <button type="button" className="btn btn-navy btn-sm" onClick={onEdit}>
        <Pencil size={16} /> עריכה
      </button>
    </div>
  );
}

function StopCard({
  day,
  stop,
  place,
  places,
  arrivesOnFoot,
  onOpenPlace,
}: {
  day: Day;
  stop: Stop;
  place: Place;
  places: Map<string, Place>;
  arrivesOnFoot: boolean;
  onOpenPlace: (place: Place) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const title = stop.title ?? place.name;
  const long = place.description.length > 90;

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
          {place.local !== title && <span className="stop-local latin">{place.local}</span>}
        </span>
        <Photo place={place} className="stop-thumb" iconSize={30} />
      </button>
      <div className="stop-body">
        {stop.note && <p className="stop-note">{stop.note}</p>}
        <p className={`stop-desc${long && !expanded ? " is-clamped" : ""}`}>{place.description}</p>
        {long && (
          <button type="button" className="more-link" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "פחות" : "לקרוא עוד"}
          </button>
        )}
        <Tags tags={place.tags?.filter((t) => t !== "free")} />
        {stop.alts?.map((alt) => {
          const altPlace = alt.placeId ? places.get(alt.placeId) : undefined;
          return (
            <button
              key={alt.text}
              type="button"
              className={`stop-alt${alt.kosher ? " is-kosher" : ""}`}
              onClick={() => altPlace && onOpenPlace(altPlace)}
            >
              <UtensilsCrossed size={18} aria-hidden />
              <span>{alt.text}</span>
            </button>
          );
        })}
        <div className="stop-actions">
          {arrivesOnFoot ? (
            <a className="btn btn-primary" href={directionsUrl(place)} target="_blank" rel="noreferrer">
              <Navigation size={18} /> ניווט ברגל
            </a>
          ) : (
            <a className="btn btn-primary" href={mapsUrl(place)} target="_blank" rel="noreferrer">
              <MapIcon size={18} /> פתיחה במפה
            </a>
          )}
          <button
            type="button"
            className="btn btn-soft done-btn"
            aria-pressed={!!stop.done}
            onClick={() => updateStop(day.id, stop.id, { done: !stop.done })}
          >
            <Check size={18} /> {stop.done ? "היינו!" : "היינו"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------- Sharing ---------- */

function dayAsText(day: Day, number: number, places: Map<string, Place>): string {
  const lines = [`יום ${number} · ${day.label}`, day.title, ""];
  for (const stop of day.stops) {
    const place = stop.placeId ? places.get(stop.placeId) : undefined;
    const name = stop.title ?? place?.name ?? "";
    lines.push(`${stop.time}  ${name}${place && !stop.compact ? ` (${place.address})` : ""}`);
    if (stop.note) lines.push(`      ${stop.note}`);
  }
  return lines.join("\n");
}

/* ---------- Page ---------- */

export function PlanView() {
  const trip = useTrip();
  const settings = useSettings();
  const today = useToday();
  const places = useMemo(() => placeIndex(trip), [trip]);
  const [editing, setEditing] = useState(false);
  const [openPlace, setOpenPlace] = useState<Place | null>(null);
  const [editStop, setEditStop] = useState<Stop | null>(null);
  const [adding, setAdding] = useState(false);

  // A pick made today wins; otherwise jump to today's day during the trip.
  const picked = settings.dayPick?.on === today ? settings.dayPick.id : undefined;
  const dayId = picked ?? trip.days.find((d) => d.date === today)?.id ?? trip.days[0].id;
  const dayIndex = Math.max(0, trip.days.findIndex((d) => d.id === dayId));
  const day = trip.days[dayIndex];
  const hotel = places.get(HOTEL_ID)!;
  const { rows, endLeg } = layoutDay(day, places, hotel);

  function pickDay(id: string) {
    updateSettings({ dayPick: { id, on: todayIso() } });
    setEditing(false);
  }

  async function shareDay() {
    const text = dayAsText(day, dayIndex + 1, places);
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
    <div style={{ "--day": day.color } as React.CSSProperties}>
      <section className="hero" aria-label="הטיול">
        <BudapestScene className="hero-art" />
        <Photo place={HERO} width={960} iconSize={0} />
        <div className="hero-top">
          <span className="glass-pill">{countdown(today, trip.days)}</span>
          <span className="glass-pill">
            <Snowflake size={15} aria-hidden /> 0–7°
          </span>
        </div>
        <div className="hero-text">
          <div className="hero-dates">{TRIP_INFO.dates} · 4 ימים</div>
          <h1 className="hero-title">{TRIP_INFO.title}</h1>
          <p className="hero-tagline">{TRIP_INFO.tagline}</p>
        </div>
      </section>

      <nav className="quick-grid" aria-label="קיצורים">
        <a className="quick" href={directionsUrl(hotel)} target="_blank" rel="noreferrer">
          <span className="q-icon" style={{ "--q": "#a3302a", "--q-bg": "#fdeae8" } as React.CSSProperties}>
            <BedDouble size={22} aria-hidden />
          </span>
          חזרה למלון
        </a>
        <Link className="quick" href={`/map?day=${day.id}`}>
          <span className="q-icon" style={{ "--q": "#2b4c80", "--q-bg": "#e5edf9" } as React.CSSProperties}>
            <MapIcon size={22} aria-hidden />
          </span>
          מפת היום
        </Link>
        <Link className="quick" href="/esim">
          <span className="q-icon" style={{ "--q": "#1f6a3f", "--q-bg": "#e2f2e7" } as React.CSSProperties}>
            <Wifi size={22} aria-hidden />
          </span>
          אינטרנט
        </Link>
        <Link className="quick" href="/info#sos">
          <span className="q-icon" style={{ "--q": "#fff", "--q-bg": "#c8372d" } as React.CSSProperties}>
            <Siren size={22} aria-hidden />
          </span>
          חירום
        </Link>
      </nav>

      <section className="card hotel" aria-label="המלון">
        <Photo place={hotel} iconSize={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="muted small">המלון שלכם</div>
          <div className="hotel-name latin" style={{ textAlign: "start" }}>
            {hotel.local}
          </div>
          <div className="muted small latin" style={{ textAlign: "start" }}>
            Kossuth Lajos utca 7-9
          </div>
          <div className="muted small">ליד תחנת המטרו Astoria</div>
        </div>
        {hotel.phone && (
          <a className="icon-btn" href={`tel:${hotel.phone.replace(/\s/g, "")}`} aria-label="התקשרות למלון">
            <Phone size={20} />
          </a>
        )}
      </section>

      <h2 className="section-title">התוכנית</h2>
      <div className="day-strip" role="group" aria-label="בחירת יום">
        {trip.days.map((d) => {
          const [, month, date] = d.date.split("-").map(Number);
          return (
            <button
              key={d.id}
              type="button"
              className="day-chip"
              style={{ "--chip": d.color } as React.CSSProperties}
              aria-pressed={d.id === day.id}
              onClick={() => pickDay(d.id)}
            >
              <span className="d-week">{d.label.split(" · ")[0]}</span>
              <span className="d-num">{date}</span>
              <span className="d-month">{MONTHS[month - 1]}</span>
            </button>
          );
        })}
      </div>

      <header className="day-card">
        <div className="page-kicker">
          יום {dayIndex + 1} · {day.label}
        </div>
        <h2 className="day-title">{day.title}</h2>
        <p className="day-summary">{day.summary}</p>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-sm"
            aria-pressed={editing}
            onClick={() => setEditing((v) => !v)}
          >
            <Pencil size={16} /> {editing ? "סיום עריכה" : "שינוי היום"}
          </button>
          <button type="button" className="btn btn-sm" onClick={shareDay}>
            <Share2 size={16} /> שליחה בוואטסאפ
          </button>
        </div>
      </header>

      {editing && (
        <div className="edit-banner" role="status">
          מצב עריכה: החיצים מזיזים עצירה, „עריכה” משנה שעה, שם או יום, ואפשר גם למחוק.
        </div>
      )}

      <div className="timeline">
        {rows.map(({ stop, place, leg, i, isRest, number }) => (
          <div key={stop.id} className="tl-item">
            {leg && <LegRow leg={leg.leg} estimated={leg.estimated} />}
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
                      onEdit={() => setEditStop(stop)}
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
                    onOpenPlace={setOpenPlace}
                  />
                  {editing && (
                    <EditBar
                      day={day}
                      stop={stop}
                      isFirst={i === 0}
                      isLast={i === rows.length - 1}
                      onEdit={() => setEditStop(stop)}
                    />
                  )}
                </article>
              )}
            </div>
          </div>
        ))}
        {endLeg && <LegRow leg={endLeg.leg} estimated={endLeg.estimated} />}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginBlockStart: 18 }}
        onClick={() => setAdding(true)}
      >
        <Plus size={20} /> הוספת עצירה ליום {dayIndex + 1}
      </button>

      {openPlace && (
        <PlaceSheet place={openPlace} defaultDayId={day.id} onClose={() => setOpenPlace(null)} />
      )}
      {editStop && (
        <StopEditor
          day={day}
          stop={editStop}
          place={editStop.placeId ? places.get(editStop.placeId) : undefined}
          onClose={() => setEditStop(null)}
        />
      )}
      {adding && <AddStopSheet day={day} onClose={() => setAdding(false)} />}
    </div>
  );
}
