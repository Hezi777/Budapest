"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarPlus,
  Check,
  Clock,
  Copy,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Search,
  Trash,
  Undo2,
} from "lucide-react";
import { Photo, Sheet, Tags, useToast } from "./ui";
import { allPlaces, plannedIds } from "@/lib/catalog";
import { directionsUrl } from "@/lib/geo";
import {
  addStop,
  moveStopToDay,
  removeStop,
  updateSettings,
  updateStop,
  useTrip,
} from "@/lib/store";
import type { Day, Place, Reservation, Stop } from "@/lib/types";

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

/** A time, kept left-to-right inside Hebrew text. */
function Time({ value }: { value: string }) {
  return <bdi dir="ltr">{value}</bdi>;
}

/** Today's date, as the plan remembers which day tab was picked. */
function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ---------- Day + time pickers ---------- */

/** Big buttons for the four days: pick one, the picked one turns black. */
function DayPicker({ days, dayId, onDay }: { days: Day[]; dayId: string; onDay: (id: string) => void }) {
  return (
    <div className="field" role="group" aria-labelledby="ps-day-label">
      <span className="field-label" id="ps-day-label">באיזה יום?</span>
      <div className="ps-days">
        {days.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className="ps-day"
            aria-pressed={d.id === dayId}
            style={{ "--chip": d.color } as React.CSSProperties}
            onClick={() => onDay(d.id)}
          >
            <span className="ps-day-name">
              {d.id === dayId ? <Check size={18} strokeWidth={3} aria-hidden /> : <span className="ps-dot" />}
              יום {i + 1}
            </span>
            <span className="ps-day-date">{d.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const PRESET_TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

/** Preset hours to tap, and "another time" for anything else. */
function TimePicker({ time, onTime }: { time: string; onTime: (time: string) => void }) {
  const [custom, setCustom] = useState(false);
  // A time that isn't an hour on the hour (12:15, say) still shows, picked.
  const times = PRESET_TIMES.includes(time) || !time ? PRESET_TIMES : [time, ...PRESET_TIMES];
  return (
    <div className="field" role="group" aria-labelledby="ps-time-label">
      <span className="field-label" id="ps-time-label">באיזו שעה?</span>
      <div className="ps-times">
        {times.map((t) => (
          <button
            key={t}
            type="button"
            className="ps-time"
            aria-pressed={t === time}
            onClick={() => {
              onTime(t);
              setCustom(false);
            }}
          >
            <Time value={t} />
          </button>
        ))}
      </div>
      {custom ? (
        <label className="field">
          <span className="field-label">שעה אחרת</span>
          <input className="input" type="time" value={time} onChange={(e) => onTime(e.target.value)} required />
        </label>
      ) : (
        <button type="button" className="btn btn-soft ps-other-time" onClick={() => setCustom(true)}>
          <Clock size={20} aria-hidden /> שעה אחרת
        </button>
      )}
    </div>
  );
}

/** How the day looks now, so the time is easy to choose. */
function DayHint({ day, number }: { day: Day; number: number }) {
  const last = day.stops[day.stops.length - 1];
  return (
    <p className="ps-hint">
      {last ? (
        <>
          ביום {number} יש כבר {day.stops.length} עצירות, האחרונה ב־<Time value={last.time} />.
        </>
      ) : (
        <>ביום {number} אין עדיין עצירות.</>
      )}
    </p>
  );
}

/* ---------- Place details ---------- */

function AddressRow({ address }: { address: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 5000);
  }

  return (
    <div className="fact ps-address">
      <MapPin size={22} aria-hidden />
      <span className="ps-address-text">
        <span className="latin">{address}</span>
        {state === "failed" && <span className="ps-copy-note">לא הצלחנו להעתיק. אפשר ללחוץ על הכתובת ולהחזיק.</span>}
      </span>
      <button type="button" className="btn btn-soft btn-sm" onClick={copy} aria-live="polite">
        {state === "copied" ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
        {state === "copied" ? "הועתקה" : "העתקה"}
      </button>
    </div>
  );
}

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
  const pathname = usePathname();
  const [adding, setAdding] = useState(false);
  const [dayId, setDayId] = useState(defaultDayId ?? trip.days[0].id);
  const day = trip.days.find((d) => d.id === dayId) ?? trip.days[0];
  const [time, setTime] = useState(() => nextFreeTime(day));
  // What was just added, shown until the sheet is closed.
  const [added, setAdded] = useState<{ dayId: string; time: string } | null>(null);
  const form = useRef<HTMLDivElement>(null);
  const scheduled = trip.days.filter((d) => d.stops.some((s) => s.placeId === place.id));
  const planned = scheduled.length > 0;

  function openForm() {
    setAdding(true);
    // The form opens below the buttons; bring it into view.
    requestAnimationFrame(() => form.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  function add() {
    addStop(dayId, { placeId: place.id, time });
    setAdded({ dayId, time });
    setAdding(false);
    requestAnimationFrame(() => form.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  /** Make the plan open on the day that was added to. */
  function showDay() {
    if (added) updateSettings({ dayPick: { id: added.dayId, on: todayIso() } });
  }

  // One main action (black): adding for a place not yet planned, navigating for one that is.
  const kind = (main: boolean) => `btn btn-block ps-action ${main ? "btn-primary" : "btn-outline"}`;
  const nav = (
    <a className={kind(planned)} href={directionsUrl(place)} target="_blank" rel="noreferrer">
      <Navigation size={22} aria-hidden /> ניווט
    </a>
  );
  const addButton = (
    <button type="button" className={kind(!planned)} onClick={openForm}>
      <CalendarPlus size={22} aria-hidden /> {planned ? "הוספה ליום נוסף" : "הוספה לתוכנית"}
    </button>
  );

  return (
    <Sheet title={place.name} onClose={onClose}>
      {place.local !== place.name && <div className="latin ps-local">{place.local}</div>}
      <Photo place={place} className="sheet-photo" width={960} iconSize={0} hideIfMissing />
      <Tags tags={place.tags} />
      {planned && (
        <p className="ps-inplan">
          <CalendarCheck size={20} aria-hidden /> כבר בתוכנית: {scheduled.map((d) => `יום ${dayNumber(trip, d.id)}`).join(", ")}
        </p>
      )}
      <p className="stop-desc">{place.description}</p>
      {place.why && <p className="ps-why">{place.why}</p>}

      <div className="card facts">
        <AddressRow address={place.address} />
        {place.hours && (
          <div className="fact">
            <Clock size={22} aria-hidden />
            <span>{place.hours}</span>
          </div>
        )}
        {place.duration && (
          <div className="fact">
            <Clock size={22} aria-hidden />
            <span>זמן ביקור: {place.duration}</span>
          </div>
        )}
        {place.price && (
          <div className="fact">
            <span aria-hidden className="ps-shekel">₪</span>
            <span>{place.price}</span>
          </div>
        )}
        {place.phone && (
          <a className="fact" href={`tel:${place.phone.replace(/\s/g, "")}`}>
            <Phone size={22} aria-hidden />
            <span>
              להתקשר: <bdi className="latin">{place.phone}</bdi>
            </span>
          </a>
        )}
        {place.website && (
          <a className="fact" href={place.website} target="_blank" rel="noreferrer">
            <Globe size={22} aria-hidden />
            <span>
              לאתר: <bdi className="latin">{place.website.replace(/^https?:\/\/(www\.)?/, "")}</bdi>
            </span>
          </a>
        )}
      </div>

      <div ref={form} className="ps-flow">
        {added ? (
          <div className="card card-pad ps-done" role="status">
            <span className="ps-done-icon" aria-hidden>
              <Check size={28} strokeWidth={3} />
            </span>
            <p className="ps-done-text">
              נוסף ליום {dayNumber(trip, added.dayId)} בשעה <Time value={added.time} />
            </p>
            <p className="ps-hint">לשנות או למחוק: בתוכנית, „שינוי היום” ואז „עריכה”.</p>
            {pathname === "/" ? (
              <button type="button" className="btn btn-primary btn-block ps-action" onClick={onClose}>
                חזרה לתוכנית
              </button>
            ) : (
              <Link className="btn btn-primary btn-block ps-action" href="/" onClick={showDay}>
                <CalendarCheck size={22} aria-hidden /> לראות ביום {dayNumber(trip, added.dayId)} בתוכנית
              </Link>
            )}
            <button type="button" className="btn btn-outline btn-block ps-action" onClick={onClose}>
              סגירה
            </button>
          </div>
        ) : adding ? (
          <div className="card card-pad ps-form">
            <DayPicker
              days={trip.days}
              dayId={dayId}
              onDay={(id) => {
                setDayId(id);
                const d = trip.days.find((x) => x.id === id);
                if (d) setTime(nextFreeTime(d));
              }}
            />
            <TimePicker time={time} onTime={setTime} />
            <DayHint day={day} number={dayNumber(trip, dayId)} />
            <button type="button" className="btn btn-primary btn-block ps-action" onClick={add} disabled={!time}>
              <CalendarPlus size={22} aria-hidden /> להוסיף ליום {dayNumber(trip, dayId)} בשעה <Time value={time || "--:--"} />
            </button>
            <button type="button" className="btn btn-soft btn-block ps-action" onClick={() => setAdding(false)}>
              ביטול
            </button>
          </div>
        ) : (
          <div className="ps-actions">
            {planned ? nav : addButton}
            {planned ? addButton : nav}
            <p className="ps-hint ps-nav-hint">ניווט פותח את Google Maps</p>
          </div>
        )}
      </div>
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
  const [step, setStep] = useState<"edit" | "confirm" | "deleted">("edit");
  const name = stop.title ?? place?.name ?? "העצירה";

  function save() {
    updateStop(day.id, stop.id, {
      time,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
    });
    if (dayId !== day.id) {
      moveStopToDay(day.id, stop.id, dayId);
    }
    toast(`נשמר: יום ${dayNumber(trip, dayId)}, ${time}`);
    onClose();
  }

  function remove() {
    removeStop(day.id, stop.id);
    setStep("deleted");
  }

  /** Put the stop back, exactly as it was before the delete. */
  function undo() {
    const restored: Partial<Stop> = { ...stop };
    delete restored.id;
    addStop(day.id, restored as Omit<Stop, "id">);
    toast("העצירה חזרה לתוכנית");
    onClose();
  }

  if (step === "deleted") {
    return (
      <Sheet title="נמחק מהתוכנית" onClose={onClose}>
        <div className="card card-pad ps-done" role="status">
          <span className="ps-done-icon is-removed" aria-hidden>
            <Trash size={26} />
          </span>
          <p className="ps-done-text">
            <bdi>{name}</bdi>
          </p>
          <p className="ps-hint">נמחק מיום {dayNumber(trip, day.id)}. נמחק בטעות? אפשר להחזיר.</p>
          <button type="button" className="btn btn-primary btn-block ps-action" onClick={undo}>
            <Undo2 size={22} aria-hidden /> החזרה לתוכנית
          </button>
          <button type="button" className="btn btn-outline btn-block ps-action" onClick={onClose}>
            סגירה
          </button>
        </div>
      </Sheet>
    );
  }

  if (step === "confirm") {
    return (
      <Sheet title="למחוק את העצירה?" onClose={onClose}>
        <div className="card card-pad ps-done">
          <p className="ps-done-text">
            <bdi>{name}</bdi>
          </p>
          <p className="ps-hint">העצירה תימחק מיום {dayNumber(trip, day.id)}.</p>
          <button type="button" className="btn btn-outline btn-block ps-action" onClick={() => setStep("edit")}>
            לא, להשאיר
          </button>
          <button type="button" className="btn btn-danger btn-block ps-action" onClick={remove}>
            <Trash size={22} aria-hidden /> כן, למחוק
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title="עריכת עצירה" onClose={onClose}>
      <label className="field">
        <span className="field-label">שם העצירה</span>
        <input
          className="input ps-input"
          value={title}
          placeholder={place?.name ?? "למשל: מנוחה במלון"}
          onChange={(e) => setTitle(e.target.value)}
        />
        {place && <span className="ps-hint">אם משאירים ריק, יופיע שם המקום.</span>}
      </label>
      <DayPicker days={trip.days} dayId={dayId} onDay={setDayId} />
      <TimePicker time={time} onTime={setTime} />
      <label className="field">
        <span className="field-label">הערה שלנו</span>
        <textarea
          className="input ps-input"
          value={note}
          placeholder="למשל: להזמין שולחן, לקנות מגנט"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button type="button" className="btn btn-primary btn-block ps-action" onClick={save} disabled={!time}>
        <Check size={22} aria-hidden /> שמירה
      </button>
      <button type="button" className="btn btn-danger btn-block ps-action" onClick={() => setStep("confirm")}>
        <Trash size={22} aria-hidden /> מחיקה מהתוכנית
      </button>
    </Sheet>
  );
}

/* ---------- Reservation ---------- */

/**
 * A booked table or time slot: when, under whose name, and a short note.
 * Shared through the plan without a login, so nothing sensitive (tickets, card numbers).
 */
export function ReservationSheet({
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
  const toast = useToast();
  const existing = stop.reservation;
  const [time, setTime] = useState(existing?.time ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const title = stop.title ?? place?.name ?? "העצירה";

  function save() {
    const reservation: Reservation = {
      time: time || undefined,
      name: name.trim() || undefined,
      note: note.trim() || undefined,
    };
    const empty = !reservation.time && !reservation.name && !reservation.note;
    updateStop(day.id, stop.id, { reservation: empty ? undefined : reservation });
    toast(empty ? "אין הזמנה" : `ההזמנה נשמרה${reservation.time ? ` ל־${reservation.time}` : ""}`);
    onClose();
  }

  function remove() {
    updateStop(day.id, stop.id, { reservation: undefined });
    toast("ההזמנה נמחקה", {
      label: "ביטול",
      onClick: () => updateStop(day.id, stop.id, { reservation: existing }),
    });
    onClose();
  }

  return (
    <Sheet title={existing ? "ההזמנה" : "הוספת הזמנה"} onClose={onClose}>
      <p className="ps-hint">
        <bdi>{title}</bdi> · {day.label}
      </p>
      <label className="field">
        <span className="field-label">לאיזו שעה?</span>
        <input className="input ps-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <label className="field">
        <span className="field-label">על שם</span>
        <input
          className="input ps-input"
          value={name}
          placeholder="למשל: בני"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="field-label">פרטים (לא חובה)</span>
        <textarea
          className="input ps-input"
          value={note}
          placeholder="למשל: מספר אישור, שולחן לשניים, לבוא 10 דקות לפני"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <p className="ps-hint">מופיע גם בטלפון השני. בלי כרטיסים, פרטי אשראי או סיסמאות: אלה נשארים במייל.</p>
      <button type="button" className="btn btn-primary btn-block ps-action" onClick={save}>
        <Check size={22} aria-hidden /> שמירה
      </button>
      {existing && (
        <button type="button" className="btn btn-outline btn-block ps-action" onClick={remove}>
          <Trash size={22} aria-hidden /> מחיקת ההזמנה
        </button>
      )}
    </Sheet>
  );
}

/** One line for a booked stop, e.g. "הזמנה ל־19:30 · על שם בני". */
export function reservationLabel(r: Reservation): string {
  const parts = [r.time ? `הזמנה ל־${r.time}` : "יש הזמנה"];
  if (r.name) parts.push(`על שם ${r.name}`);
  return parts.join(" · ");
}

/* ---------- Add a stop to a day ---------- */

export function AddStopSheet({ day, onClose }: { day: Day; onClose: () => void }) {
  const trip = useTrip();
  const toast = useToast();
  const [time, setTime] = useState(() => nextFreeTime(day));
  const [query, setQuery] = useState("");
  const [freeText, setFreeText] = useState("");
  // A place that was tapped and waits for "yes, add it".
  const [pending, setPending] = useState<Place | null>(null);
  const planned = plannedIds(trip);
  const number = dayNumber(trip, day.id);

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
    toast(`${place.name} נוסף ליום ${number} בשעה ${time}`);
    onClose();
  }

  function addNote() {
    if (!freeText.trim()) return;
    addStop(day.id, { title: freeText.trim(), time, compact: true });
    toast(`נוסף ליום ${number} בשעה ${time}`);
    onClose();
  }

  if (pending) {
    return (
      <Sheet title={`הוספה ליום ${number}`} onClose={onClose}>
        <div className="card stop-head ps-pending">
          <Photo place={pending} className="stop-thumb" iconSize={26} />
          <span className="stop-info">
            <span className="stop-title">{pending.name}</span>
            {pending.local !== pending.name && <span className="stop-local latin">{pending.local}</span>}
          </span>
        </div>
        <TimePicker time={time} onTime={setTime} />
        <button type="button" className="btn btn-primary btn-block ps-action" onClick={() => addPlace(pending)} disabled={!time}>
          <CalendarPlus size={22} aria-hidden /> להוסיף ליום {number} בשעה <Time value={time || "--:--"} />
        </button>
        <button type="button" className="btn btn-soft btn-block ps-action" onClick={() => setPending(null)}>
          חזרה לרשימה
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet title={`הוספה ליום ${number}`} onClose={onClose}>
      <TimePicker time={time} onTime={setTime} />
      <DayHint day={day} number={number} />

      <div className="field">
        <label className="field-label" htmlFor="ps-free">משהו משלנו (מנוחה, פגישה, קניות)</label>
        <div className="ps-free-row">
          <input
            id="ps-free"
            className="input ps-input"
            value={freeText}
            placeholder="למשל: מנוחה במלון"
            onChange={(e) => setFreeText(e.target.value)}
          />
          <button type="button" className="btn btn-primary ps-action" onClick={addNote} disabled={!freeText.trim()}>
            הוספה
          </button>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="ps-search">או לבחור מקום מהרשימה</label>
        <div className="search" style={{ margin: 0 }}>
          <Search size={20} aria-hidden />
          <input
            id="ps-search"
            className="input ps-input"
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
            onClick={() => setPending(place)}
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
