"use client";

import { useMemo, useState } from "react";
import {
  CalendarPlus,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Search,
  Trash,
} from "lucide-react";
import { Photo, Sheet, Tags, useToast } from "./ui";
import { allPlaces, plannedIds } from "@/lib/catalog";
import { directionsUrl, mapsUrl } from "@/lib/geo";
import {
  addStop,
  moveStopToDay,
  removeStop,
  updateStop,
  useTrip,
} from "@/lib/store";
import type { Day, Place, Stop } from "@/lib/types";

function nextFreeTime(day: Day): string {
  const last = day.stops[day.stops.length - 1];
  if (!last) return "10:00";
  const [h, m] = last.time.split(":").map(Number);
  const hour = Math.min(h + 1, 23);
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dayNumber(trip: { days: Day[] }, dayId: string) {
  return trip.days.findIndex((d) => d.id === dayId) + 1;
}

/* ---------- Day + time picker ---------- */

function DayTimePicker({
  days,
  dayId,
  time,
  onDay,
  onTime,
}: {
  days: Day[];
  dayId: string;
  time: string;
  onDay: (id: string) => void;
  onTime: (time: string) => void;
}) {
  return (
    <>
      <div className="field">
        <span className="field-label">באיזה יום?</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {days.map((d, i) => (
            <button
              key={d.id}
              type="button"
              className="day-chip"
              style={{ "--chip": d.color } as React.CSSProperties}
              aria-pressed={d.id === dayId}
              onClick={() => onDay(d.id)}
            >
              <span className="d-week">{d.label.split(" · ")[0]}</span>
              <span className="d-num">{i + 1}</span>
              <span className="d-month">יום</span>
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span className="field-label">באיזו שעה?</span>
        <input
          className="input"
          type="time"
          value={time}
          onChange={(e) => onTime(e.target.value)}
          required
        />
      </label>
    </>
  );
}

/* ---------- Place details ---------- */

export function PlaceSheet({
  place,
  onClose,
  defaultDayId,
}: {
  place: Place;
  onClose: () => void;
  defaultDayId?: string;
}) {
  const trip = useTrip();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [dayId, setDayId] = useState(defaultDayId ?? trip.days[0].id);
  const day = trip.days.find((d) => d.id === dayId) ?? trip.days[0];
  const [time, setTime] = useState(() => nextFreeTime(day));
  const scheduled = trip.days.filter((d) => d.stops.some((s) => s.placeId === place.id));

  function add() {
    addStop(dayId, { placeId: place.id, time });
    toast(`נוסף ליום ${dayNumber(trip, dayId)} בשעה ${time}`);
    onClose();
  }

  return (
    <Sheet title={place.name} onClose={onClose}>
      <Photo place={place} className="sheet-photo" width={960} iconSize={48} />
      {place.local !== place.name && (
        <div className="latin muted" style={{ textAlign: "end", marginBlockStart: -6 }}>
          {place.local}
        </div>
      )}
      <Tags tags={place.tags} />
      <p className="stop-desc">{place.description}</p>
      {place.why && <p className="idea-why">{place.why}</p>}

      <div className="card facts">
        <div className="fact">
          <MapPin size={20} />
          <span className="latin">{place.address}</span>
        </div>
        {place.hours && (
          <div className="fact">
            <Clock size={20} />
            <span>{place.hours}</span>
          </div>
        )}
        {place.duration && (
          <div className="fact">
            <Clock size={20} />
            <span>זמן ביקור: {place.duration}</span>
          </div>
        )}
        {place.price && (
          <div className="fact">
            <span aria-hidden style={{ width: 20, textAlign: "center", fontWeight: 800 }}>₪</span>
            <span>{place.price}</span>
          </div>
        )}
        {place.phone && (
          <a className="fact" href={`tel:${place.phone.replace(/\s/g, "")}`}>
            <Phone size={20} />
            <span className="latin">{place.phone}</span>
          </a>
        )}
        {place.website && (
          <a className="fact" href={place.website} target="_blank" rel="noreferrer">
            <Globe size={20} />
            <span className="latin">{place.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
          </a>
        )}
        {scheduled.length > 0 && (
          <div className="fact in-plan">
            כבר בתוכנית: {scheduled.map((d) => `יום ${dayNumber(trip, d.id)}`).join(", ")}
          </div>
        )}
      </div>

      <div className="btn-row">
        <a className="btn btn-navy" href={directionsUrl(place)} target="_blank" rel="noreferrer">
          <Navigation size={20} /> ניווט ברגל
        </a>
        <a className="btn btn-outline" href={mapsUrl(place)} target="_blank" rel="noreferrer">
          <ExternalLink size={20} /> בגוגל מפות
        </a>
      </div>

      {!adding ? (
        <button type="button" className="btn btn-outline" onClick={() => setAdding(true)}>
          <CalendarPlus size={20} /> הוספה לתוכנית
        </button>
      ) : (
        <div className="card card-pad" style={{ display: "grid", gap: 14 }}>
          <DayTimePicker
            days={trip.days}
            dayId={dayId}
            time={time}
            onDay={(id) => {
              setDayId(id);
              const d = trip.days.find((x) => x.id === id);
              if (d) setTime(nextFreeTime(d));
            }}
            onTime={setTime}
          />
          <button type="button" className="btn btn-navy" onClick={add} disabled={!time}>
            <CalendarPlus size={20} /> הוספה ליום {dayNumber(trip, dayId)}
          </button>
        </div>
      )}
    </Sheet>
  );
}

/* ---------- Edit a stop ---------- */

export function StopEditor({
  day,
  stop,
  place,
  onClose,
}: {
  day: Day;
  stop: Stop;
  place?: Place;
  onClose: () => void;
}) {
  const trip = useTrip();
  const toast = useToast();
  const [time, setTime] = useState(stop.time);
  const [title, setTitle] = useState(stop.title ?? "");
  const [note, setNote] = useState(stop.note ?? "");
  const [dayId, setDayId] = useState(day.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    updateStop(day.id, stop.id, {
      time,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
    });
    if (dayId !== day.id) {
      moveStopToDay(day.id, stop.id, dayId);
      toast(`הועבר ליום ${dayNumber(trip, dayId)}`);
    } else {
      toast("נשמר");
    }
    onClose();
  }

  function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    removeStop(day.id, stop.id);
    toast("נמחק מהתוכנית");
    onClose();
  }

  return (
    <Sheet title="עריכת עצירה" onClose={onClose}>
      <label className="field">
        <span className="field-label">שם</span>
        <input
          className="input"
          value={title}
          placeholder={place?.name ?? "למשל: מנוחה במלון"}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <DayTimePicker days={trip.days} dayId={dayId} time={time} onDay={setDayId} onTime={setTime} />
      <label className="field">
        <span className="field-label">הערה שלנו</span>
        <textarea
          className="input"
          value={note}
          placeholder="למשל: להזמין שולחן, לקנות מגנט"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button type="button" className="btn btn-navy" onClick={save} disabled={!time}>
        שמירה
      </button>
      <button type="button" className="btn btn-danger" onClick={remove}>
        <Trash size={20} /> {confirmDelete ? "בטוח? ללחוץ שוב למחיקה" : "מחיקה מהתוכנית"}
      </button>
    </Sheet>
  );
}

/* ---------- Add a stop to a day ---------- */

export function AddStopSheet({ day, onClose }: { day: Day; onClose: () => void }) {
  const trip = useTrip();
  const toast = useToast();
  const [time, setTime] = useState(() => nextFreeTime(day));
  const [query, setQuery] = useState("");
  const [freeText, setFreeText] = useState("");
  const planned = plannedIds(trip);

  const places = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPlaces(trip).filter(
      (p) =>
        p.category !== "transport" &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.local.toLowerCase().includes(q) ||
          p.description.includes(q)),
    );
  }, [trip, query]);

  function addPlace(place: Place) {
    addStop(day.id, { placeId: place.id, time });
    toast(`${place.name} נוסף בשעה ${time}`);
    onClose();
  }

  function addNote() {
    if (!freeText.trim()) return;
    addStop(day.id, { title: freeText.trim(), time, compact: true });
    toast("נוסף לתוכנית");
    onClose();
  }

  return (
    <Sheet title={`הוספה ליום ${dayNumber(trip, day.id)}`} onClose={onClose}>
      <label className="field">
        <span className="field-label">באיזו שעה?</span>
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>

      <div className="field">
        <span className="field-label">משהו משלנו (מנוחה, פגישה, קניות)</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            value={freeText}
            placeholder="למשל: מנוחה במלון"
            onChange={(e) => setFreeText(e.target.value)}
          />
          <button type="button" className="btn btn-navy" onClick={addNote} disabled={!freeText.trim()}>
            הוספה
          </button>
        </div>
      </div>

      <div className="field">
        <span className="field-label">או לבחור מקום מהרשימה</span>
        <div className="search" style={{ margin: 0 }}>
          <Search size={20} />
          <input
            className="input"
            type="search"
            value={query}
            placeholder="חיפוש: כשר, שוק, קפה…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {places.map((place) => (
          <button
            key={place.id}
            type="button"
            className="card stop-head"
            onClick={() => addPlace(place)}
          >
            <Photo place={place} className="stop-thumb" iconSize={26} />
            <span className="stop-info">
              <span className="stop-title">{place.name}</span>
              {place.local !== place.name && <span className="stop-local latin">{place.local}</span>}
              <Tags tags={place.tags?.filter((t) => t === "kosher" || t === "christmas")} />
              {planned.has(place.id) && <span className="in-plan">כבר בתוכנית</span>}
            </span>
          </button>
        ))}
        {places.length === 0 && <p className="empty">לא נמצא. אפשר להוסיף כטקסט חופשי למעלה.</p>}
      </div>
    </Sheet>
  );
}
