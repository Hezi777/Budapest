"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BedDouble, Check, Footprints, LoaderCircle, LocateFixed, Navigation, Star, X } from "lucide-react";
import { PlaceSheet } from "./place-sheet";
import { Photo, Sheet, Tags, usePlatform } from "./ui";
import type { Me, Pin } from "./map-canvas";
import { allPlaces, isKosher, placeIndex } from "@/lib/catalog";
import { directionsUrl, distanceKm } from "@/lib/geo";
import { IDEAS } from "@/lib/ideas";
import { HOTEL_ID } from "@/lib/places";
import { useTrip } from "@/lib/store";
import type { Place } from "@/lib/types";

const MapCanvas = dynamic(() => import("./map-canvas"), {
  ssr: false,
  loading: () => <div className="empty">טוען מפה…</div>,
});

type Filter = string; // a day id, "all", "kosher" or "ideas"

/** Where the phone's location stands. */
type Gps = "off" | "searching" | "on" | "denied" | "unavailable";

const KOSHER_GREEN = "#24603d";
const IDEA_INK = "#3b3b3b";

/** A pin's meaning, drawn as a small copy of the pin itself. */
function Swatch({ kind, color, children }: { kind: "num" | "kosher" | "idea" | "hotel"; color?: string; children?: ReactNode }) {
  return (
    <span
      className={`map-swatch is-${kind}`}
      style={color ? ({ "--pin": color } as React.CSSProperties) : undefined}
      aria-hidden
    >
      {kind === "hotel" && <BedDouble size={14} strokeWidth={2.4} />}
      {kind === "kosher" && <Check size={14} strokeWidth={3} />}
      {kind === "idea" && <Star size={12} strokeWidth={2.6} />}
      {kind === "num" && children}
    </span>
  );
}

/** How far a place is, as the card says it: walking minutes, or km when far. */
function distanceText(from: Pick<Place, "lat" | "lng">, place: Place): string {
  const km = distanceKm(from, place) * 1.3;
  if (km > 3) return `${km.toFixed(1)} ק״מ`;
  return `כ־${Math.max(1, Math.round((km / 4.2) * 60))} דק' הליכה`;
}

export function MapView({ initialDay }: { initialDay?: string }) {
  const trip = useTrip();
  const platform = usePlatform();
  const places = useMemo(() => placeIndex(trip), [trip]);
  const [filter, setFilter] = useState<Filter>(
    trip.days.some((d) => d.id === initialDay) ? initialDay! : trip.days[0].id,
  );
  const [selected, setSelected] = useState<Place | null>(null);
  const [details, setDetails] = useState<Place | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [gps, setGps] = useState<Gps>("off");
  const [gpsHelp, setGpsHelp] = useState(false);
  const [follow, setFollow] = useState(false);
  const watch = useRef<number | null>(null);
  const filters = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  // Stop the GPS when leaving the map, so it doesn't drain the battery.
  useEffect(() => () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
  }, []);

  // The card is as tall as its content (and the text size); the locate button
  // and zoom buttons ride just above it.
  const cardOpen = !!selected && !details;
  useEffect(() => {
    const host = canvas.current;
    const el = card.current;
    if (!host) return;
    if (!cardOpen || !el) {
      host.style.setProperty("--map-lift", "0px");
      return;
    }
    const set = () => host.style.setProperty("--map-lift", `${el.offsetHeight + 12}px`);
    set();
    const observer = new ResizeObserver(set);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cardOpen, selected]);

  const hotel = places.get(HOTEL_ID)!;
  const hotelPin: Pin = {
    id: HOTEL_ID,
    lat: hotel.lat,
    lng: hotel.lng,
    color: "#111111",
    icon: "hotel",
    name: `המלון: ${hotel.name}`,
  };

  const { pins, route, routeColor, legend, order } = useMemo(() => {
    const day = trip.days.find((d) => d.id === filter);
    if (day) {
      const seen = new Set<string>();
      const dayPins: Pin[] = [];
      const path: [number, number][] = [];
      const order = new Map<string, { n: number; time: string }>();
      let n = 0;
      for (const stop of day.stops) {
        const place = stop.placeId ? places.get(stop.placeId) : undefined;
        // The airport is 20 km out — pinning it would shrink the city to a dot.
        if (!place || place.category === "transport") continue;
        path.push([place.lat, place.lng]);
        if (place.id === HOTEL_ID || seen.has(place.id)) continue;
        seen.add(place.id);
        n += 1;
        order.set(place.id, { n, time: stop.time });
        dayPins.push({
          id: place.id,
          lat: place.lat,
          lng: place.lng,
          color: day.color,
          label: String(n),
          name: `תחנה ${n}: ${place.name}`,
        });
      }
      return {
        pins: [...dayPins, hotelPin],
        route: path,
        routeColor: day.color,
        order: { map: order, total: n },
        legend: (
          <>
            <span className="map-legend-item">
              <Swatch kind="num" color={day.color}>1</Swatch> תחנות היום, לפי הסדר
            </span>
            <span className="map-legend-item">
              <Swatch kind="hotel" /> המלון
            </span>
          </>
        ),
      };
    }
    const hotelItem = (
      <span className="map-legend-item">
        <Swatch kind="hotel" /> המלון
      </span>
    );
    if (filter === "all") {
      const seen = new Set<string>([HOTEL_ID]);
      const all: Pin[] = [];
      trip.days.forEach((d, i) => {
        for (const stop of d.stops) {
          const place = stop.placeId ? places.get(stop.placeId) : undefined;
          if (!place || seen.has(place.id) || place.category === "transport") continue;
          seen.add(place.id);
          all.push({
            id: place.id,
            lat: place.lat,
            lng: place.lng,
            color: d.color,
            label: String(i + 1),
            small: true,
            name: `יום ${i + 1}: ${place.name}`,
          });
        }
      });
      return {
        pins: [...all, hotelPin],
        route: [],
        routeColor: "",
        order: null,
        legend: (
          <>
            <span className="map-legend-item">
              <Swatch kind="num" color="#555555">2</Swatch> המספר הוא היום בטיול
            </span>
            {hotelItem}
          </>
        ),
      };
    }
    if (filter === "kosher") {
      const kosher = allPlaces(trip)
        .filter(isKosher)
        .map((p): Pin => ({ id: p.id, lat: p.lat, lng: p.lng, color: KOSHER_GREEN, icon: "kosher", name: `כשר: ${p.name}` }));
      return {
        pins: [...kosher, hotelPin],
        route: [],
        routeColor: "",
        order: null,
        legend: (
          <>
            <span className="map-legend-item">
              <Swatch kind="kosher" color={KOSHER_GREEN} /> מקום כשר
            </span>
            {hotelItem}
          </>
        ),
      };
    }
    const ideas = IDEAS.filter((p) => p.lat > 47.4 && p.lat < 47.6).map(
      (p): Pin => ({ id: p.id, lat: p.lat, lng: p.lng, color: IDEA_INK, icon: "idea", small: true, name: p.name }),
    );
    return {
      pins: [...ideas, hotelPin],
      route: [],
      routeColor: "",
      order: null,
      legend: (
        <>
          <span className="map-legend-item">
            <Swatch kind="idea" /> מקום שאפשר להוסיף לתוכנית
          </span>
          {hotelItem}
        </>
      ),
    };
    // hotelPin is derived from places, already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, trip, places]);

  function stopWatching() {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setFollow(false);
  }

  /** First tap starts live tracking; later taps bring the map back to you. */
  function locate() {
    if (watch.current !== null) {
      if (me) setFollow(true);
      return;
    }
    if (!navigator.geolocation) {
      setGps("unavailable");
      setGpsHelp(true);
      return;
    }
    setGps("searching");
    setFollow(true);
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGps("on");
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
      },
      (err) => {
        stopWatching();
        setGps(err.code === 1 ? "denied" : "unavailable");
        setGpsHelp(true);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }

  /** "כ־8 דק' הליכה ממך" while we know where you are, else from the hotel. */
  function distanceLine(place: Place): string | null {
    if (me) return `${distanceText(me, place)} ממך`;
    if (place.id === HOTEL_ID) return null;
    return `${distanceText(hotel, place)} מהמלון`;
  }

  const chips: { id: Filter; label: string; color?: string }[] = [
    ...trip.days.map((d, i) => ({ id: d.id, label: `יום ${i + 1}`, color: d.color })),
    { id: "all", label: "כל הימים", color: "#111111" },
    { id: "kosher", label: "אוכל כשר", color: KOSHER_GREEN },
    { id: "ideas", label: "מקומות", color: "#3b3b3b" },
  ];

  const locateLabel =
    gps === "searching" ? "מחפש אתכם…" : !me ? "איפה אני?" : follow ? "עוקב אחריכם" : "חזרה אליי";
  const stopInfo = selected && order ? order.map.get(selected.id) : undefined;
  const dist = selected ? distanceLine(selected) : null;

  return (
    <div className="map-page">
      <div className="map-filters" ref={filters}>
        <div className="map-chips" role="group" aria-label="מה להציג במפה">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={filter === c.id}
              style={c.color ? ({ "--chip": c.color } as React.CSSProperties) : undefined}
              onClick={() => {
                setFilter(c.id);
                setSelected(null);
                // A new view fits its pins; don't keep chasing the GPS dot.
                setFollow(false);
              }}
            >
              {filter === c.id ? <Check size={16} strokeWidth={3} aria-hidden /> : c.color && <span className="dot" />}
              {c.label}
            </button>
          ))}
        </div>
        <p className="map-legend">{legend}</p>
      </div>
      {/* data-no-swipe: dragging the map must not switch tabs. */}
      <div className="map-canvas" data-no-swipe data-card-open={cardOpen || undefined} ref={canvas}>
        <MapCanvas
          pins={pins}
          route={route}
          routeColor={routeColor}
          fitKey={filter}
          topInset={filters}
          me={me}
          follow={follow}
          selectedId={selected?.id ?? null}
          coverBottom={card}
          onUnfollow={() => setFollow(false)}
          onSelect={(id) => setSelected(places.get(id) ?? null)}
          onBackgroundTap={() => setSelected(null)}
        />
        <button
          type="button"
          className="btn btn-outline map-locate"
          aria-pressed={gps === "on" && follow}
          data-state={gps === "searching" ? "searching" : gps === "on" ? (follow ? "following" : "away") : "idle"}
          onClick={() => (gps === "denied" || gps === "unavailable" ? setGpsHelp(true) : locate())}
        >
          {gps === "searching" ? <LoaderCircle size={22} className="spin" aria-hidden /> : <LocateFixed size={22} aria-hidden />}
          {locateLabel}
        </button>
        {/* While the place sheet is open the card steps aside; it comes back when the sheet closes. */}
        {selected && !details && (
          <div className="card map-card" role="dialog" aria-label={selected.name} ref={card}>
            <div className="map-card-top">
              <Photo place={selected} className="stop-thumb" iconSize={26} />
              <div className="stop-info" style={{ flex: 1 }}>
                {stopInfo && order && (
                  <span className="map-card-step">
                    תחנה {stopInfo.n} מתוך {order.total} ·{" "}
                    <bdi dir="ltr">{stopInfo.time}</bdi>
                  </span>
                )}
                <span className="stop-title">{selected.name}</span>
                {selected.local !== selected.name && <span className="stop-local latin">{selected.local}</span>}
                {dist && (
                  <span className="map-from-me">
                    <Footprints size={16} aria-hidden /> {dist}
                  </span>
                )}
                <Tags tags={selected.tags?.filter((t) => t === "kosher" || t === "nonKosher" || t === "booking")} />
              </div>
              <button type="button" className="icon-btn" aria-label="סגירת הכרטיס" onClick={() => setSelected(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="btn-row map-card-actions">
              <a
                className="btn btn-primary"
                href={directionsUrl(selected)}
                target="_blank"
                rel="noreferrer"
                aria-label="ניווט, נפתח ב־Google Maps"
              >
                <Navigation size={22} aria-hidden /> ניווט
              </a>
              <button type="button" className="btn btn-outline" onClick={() => setDetails(selected)}>
                פרטים
              </button>
            </div>
            <p className="map-card-hint">ניווט פותח את Google Maps</p>
          </div>
        )}
      </div>
      {details && <PlaceSheet place={details} onClose={() => setDetails(null)} />}
      {gpsHelp && (
        <Sheet title="המיקום לא פעיל" onClose={() => setGpsHelp(false)}>
          {gps === "denied" || gps === "unavailable" ? (
            <GpsHelp reason={gps} platform={platform} />
          ) : null}
          <button type="button" className="btn btn-primary btn-block map-help-ok" onClick={() => setGpsHelp(false)}>
            הבנתי
          </button>
        </Sheet>
      )}
    </div>
  );
}

/** What to do when the phone won't share its location, said plainly for this phone. */
function GpsHelp({ reason, platform }: { reason: "denied" | "unavailable"; platform: "ios" | "android" | "other" }) {
  if (reason === "unavailable") {
    return (
      <>
        <p className="map-help-lead">לא הצלחנו לדעת איפה אתם.</p>
        <p className="map-help-text">
          כדאי לוודא שהמיקום (GPS) דלוק בטלפון, לצאת למקום פתוח, ולנסות שוב. המפה ושאר האפליקציה ממשיכות לעבוד גם בלי זה.
        </p>
      </>
    );
  }
  return (
    <>
      <p className="map-help-lead">הטלפון לא נתן לאפליקציה לראות איפה אתם.</p>
      <p className="map-help-text">כדי לתקן, צריך לאשר גישה למיקום:</p>
      <ol className="map-help-steps">
        {platform === "ios" ? (
          <>
            <li>פותחים את „הגדרות” בטלפון.</li>
            <li>„פרטיות ואבטחה” ← „שירותי מיקום”.</li>
            <li>בוחרים את Safari (או הדפדפן שבו פתחתם) ← „בזמן השימוש”.</li>
            <li>חוזרים לכאן ולוחצים שוב על „איפה אני?”.</li>
          </>
        ) : (
          <>
            <li>לוחצים על סמל המנעול או על שלוש הנקודות ליד כתובת האתר.</li>
            <li>„הרשאות” ← „מיקום” ← „אפשר”.</li>
            <li>חוזרים לכאן ולוחצים שוב על „איפה אני?”.</li>
          </>
        )}
      </ol>
      <p className="map-help-text">גם בלי מיקום אפשר להשתמש בכל המפה, ולנווט מכל כרטיס.</p>
    </>
  );
}
