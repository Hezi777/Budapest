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
  UtensilsCrossed,
} from "lucide-react";
import { AddStopSheet, PlaceSheet, StopEditor } from "./place-sheet";
import { CopyAddress, Photo, Tags } from "./ui";
import { placeIndex } from "@/lib/catalog";
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

const noop = () => () => {};
const todayIso = () => new Date().toISOString().slice(0, 10);

/** Today's date on the client, null during server render. */
function useToday(): string | null {
  return useSyncExternalStore(noop, todayIso, () => null);
}

/* ---------- Legs ---------- */

function LegRow({ leg, estimated }: { leg: Leg; estimated?: boolean }) {
  if (leg.mode === "walk") {
    return (
      <div className="leg">
        <div className="leg-walk">
          <span className="leg-badge">
            <Footprints size={18} aria-hidden />
          </span>
          <span>
            {leg.text}
            {estimated && <span className="estimate"> (הערכה)</span>}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="leg">
      <div className="leg-taxi">
        <div className="leg-taxi-top">
          <span className="leg-badge">
            <CarTaxiFront size={18} aria-hidden />
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
  const rows = day.stops.map((stop, i) => {
    const place = stop.placeId ? places.get(stop.placeId) : undefined;
    // Landing at the airport has no "getting there".
    const leg = place?.category === "transport" ? undefined : resolveLeg(stop.leg, prevPlace, place);
    if (place) prevPlace = place;
    return { stop, place, leg, i };
  });
  const endTo = day.end?.to ? places.get(day.end.to) : undefined;
  return { rows, endLeg: resolveLeg(day.end, prevPlace, endTo) };
}

/* ---------- Stops ---------- */

function StopCard({
  day,
  stop,
  place,
  places,
  arrivesOnFoot,
  editing,
  isFirst,
  isLast,
  onOpenPlace,
  onEdit,
}: {
  day: Day;
  stop: Stop;
  place?: Place;
  places: Map<string, Place>;
  arrivesOnFoot: boolean;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onOpenPlace: (place: Place) => void;
  onEdit: () => void;
}) {
  const title = stop.title ?? place?.name ?? "";

  const editBar = editing && (
    <div className="stop-edit-bar">
      <button
        type="button"
        className="icon-button"
        aria-label="להקדים"
        disabled={isFirst}
        onClick={() => moveStop(day.id, stop.id, -1)}
      >
        <ChevronUp size={22} />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label="לאחר"
        disabled={isLast}
        onClick={() => moveStop(day.id, stop.id, 1)}
      >
        <ChevronDown size={22} />
      </button>
      <span className="spacer" />
      <button type="button" className="secondary-button" onClick={onEdit}>
        <Pencil size={18} /> עריכה
      </button>
    </div>
  );

  if (stop.compact || !place) {
    return (
      <div className={editing ? "card stop-card" : undefined}>
        <div className="stop-compact" style={editing ? { paddingInline: 16 } : undefined}>
          <span className="stop-time">{stop.time}</span>
          {place?.id === HOTEL_ID ? <BedDouble size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
          <span>
            <strong>{title}.</strong> {stop.note}
          </span>
        </div>
        {editBar}
      </div>
    );
  }

  return (
    <article className={`card stop-card${stop.done ? " is-done" : ""}`}>
        <button type="button" className="stop-main" onClick={() => onOpenPlace(place)}>
          <span className="stop-info" style={{ flex: 1 }}>
            <span className="stop-time">{stop.time}</span>
            <span className="stop-title">{title}</span>
            {place.local !== place.name && <span className="stop-local latin">{place.local}</span>}
          </span>
          <Photo place={place} className="stop-photo" />
        </button>
        <div className="stop-body">
          {stop.note && <p className="stop-note">{stop.note}</p>}
          <p className="stop-desc">{place.description}</p>
          <Tags tags={place.tags} />
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
          <div className="button-row">
            {arrivesOnFoot ? (
              <a className="primary-button" href={directionsUrl(place)} target="_blank" rel="noreferrer">
                <Navigation size={20} /> ניווט ברגל
              </a>
            ) : (
              <a className="primary-button" href={mapsUrl(place)} target="_blank" rel="noreferrer">
                <MapIcon size={20} /> פתיחה במפה
              </a>
            )}
            <button
              type="button"
              className="done-toggle"
              aria-pressed={!!stop.done}
              onClick={() => updateStop(day.id, stop.id, { done: !stop.done })}
              style={{ flex: "none" }}
            >
              <Check size={20} /> {stop.done ? "היינו!" : "סימון שהיינו"}
            </button>
          </div>
        </div>
        {editBar}
      </article>
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
  const dayId =
    picked ?? trip.days.find((d) => d.date === today)?.id ?? trip.days[0].id;
  const dayIndex = Math.max(0, trip.days.findIndex((d) => d.id === dayId));
  const day = trip.days[dayIndex];
  const hotel = places.get(HOTEL_ID)!;


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

  const { rows, endLeg } = layoutDay(day, places, hotel);

  return (
    <div style={{ "--day": day.color } as React.CSSProperties}>
      <section className="hero" aria-label="הטיול">
        <Photo place={HERO} width={960} iconSize={1} />
        <div className="hero-text">
          <div className="hero-dates">{TRIP_INFO.dates}</div>
          <h1 className="hero-title">{TRIP_INFO.title}</h1>
          <p className="hero-tagline">{TRIP_INFO.tagline}</p>
        </div>
      </section>

      <section className="card hotel-card" aria-label="המלון">
        <div className="hotel-row">
          <span className="hotel-icon">
            <BedDouble size={26} aria-hidden />
          </span>
          <div>
            <div className="muted small">המלון שלכם</div>
            <div className="hotel-name latin" style={{ textAlign: "start" }}>
              {hotel.local}
            </div>
            <div className="muted latin" style={{ textAlign: "start" }}>
              {hotel.address.replace(", Budapest", "")}
            </div>
            <div className="muted">ליד תחנת המטרו Astoria</div>
          </div>
        </div>
        <div className="button-row">
          <a className="primary-button" href={directionsUrl(hotel)} target="_blank" rel="noreferrer" style={{ "--day": "#b3372d" } as React.CSSProperties}>
            <Navigation size={20} /> ניווט למלון
          </a>
          {hotel.phone && (
            <a className="secondary-button" href={`tel:${hotel.phone.replace(/\s/g, "")}`} style={{ flex: "none" }}>
              <Phone size={20} /> התקשרות
            </a>
          )}
        </div>
      </section>

      <h2 className="section-heading">התוכנית</h2>
      <div className="day-picker" role="group" aria-label="בחירת יום">
        {trip.days.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className="day-tab"
            style={{ "--chip": d.color } as React.CSSProperties}
            aria-pressed={d.id === day.id}
            onClick={() => pickDay(d.id)}
          >
            <span className="day-tab-number">יום {i + 1}</span>
            <span className="day-tab-name">{d.label.split(" · ")[0]}</span>
          </button>
        ))}
      </div>

      <header className="day-header">
        <div className="day-kicker">{day.label}</div>
        <h2 className="day-title">{day.title}</h2>
        <p className="muted">{day.summary}</p>
        <div className="day-actions">
          <Link className="secondary-button" href={`/map?day=${day.id}`} style={{ flex: 1 }}>
            <MapIcon size={20} /> מפת היום
          </Link>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setEditing((v) => !v)}
            style={{ flex: 1 }}
          >
            <Pencil size={20} /> {editing ? "סיום עריכה" : "שינוי היום"}
          </button>
        </div>
      </header>

      {editing && (
        <div className="edit-banner" role="status">
          <span>מצב עריכה: חיצים להזזה, „עריכה” לשינוי שעה או מחיקה.</span>
        </div>
      )}

      <div className="timeline">
        {rows.map(({ stop, place, leg, i }) => (
          <div key={stop.id}>
            {leg && <LegRow leg={leg.leg} estimated={leg.estimated} />}
            <StopCard
              day={day}
              stop={stop}
              place={place}
              places={places}
              arrivesOnFoot={leg?.leg.mode === "walk"}
              editing={editing}
              isFirst={i === 0}
              isLast={i === rows.length - 1}
              onOpenPlace={setOpenPlace}
              onEdit={() => setEditStop(stop)}
            />
          </div>
        ))}
        {endLeg && <LegRow leg={endLeg.leg} estimated={endLeg.estimated} />}
      </div>

      <div className="button-row" style={{ marginBlockStart: 20 }}>
        <button type="button" className="primary-button" onClick={() => setAdding(true)}>
          <Plus size={20} /> הוספת עצירה ליום הזה
        </button>
        <button type="button" className="secondary-button" onClick={shareDay}>
          <Share2 size={20} /> שליחת היום בוואטסאפ
        </button>
      </div>

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
