"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Footprints, Info, LocateFixed, Navigation, X } from "lucide-react";
import { PlaceSheet } from "./place-sheet";
import { Photo, Tags, useToast } from "./ui";
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

const KOSHER_GREEN = "#24603d";
const IDEA_INK = "#3b3b3b";

export function MapView({ initialDay }: { initialDay?: string }) {
  const trip = useTrip();
  const toast = useToast();
  const places = useMemo(() => placeIndex(trip), [trip]);
  const [filter, setFilter] = useState<Filter>(
    trip.days.some((d) => d.id === initialDay) ? initialDay! : trip.days[0].id,
  );
  const [selected, setSelected] = useState<Place | null>(null);
  const [details, setDetails] = useState<Place | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [follow, setFollow] = useState(false);
  const watch = useRef<number | null>(null);

  // Stop the GPS when leaving the map, so it doesn't drain the battery.
  useEffect(() => () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
  }, []);

  const hotel = places.get(HOTEL_ID)!;
  const hotelPin: Pin = { id: HOTEL_ID, lat: hotel.lat, lng: hotel.lng, color: "#111111", icon: "hotel" };

  const { pins, route, routeColor, legend } = useMemo(() => {
    const day = trip.days.find((d) => d.id === filter);
    if (day) {
      const seen = new Set<string>();
      const dayPins: Pin[] = [];
      const path: [number, number][] = [];
      let n = 0;
      for (const stop of day.stops) {
        const place = stop.placeId ? places.get(stop.placeId) : undefined;
        // The airport is 20 km out — pinning it would shrink the city to a dot.
        if (!place || place.category === "transport") continue;
        path.push([place.lat, place.lng]);
        if (place.id === HOTEL_ID || seen.has(place.id)) continue;
        seen.add(place.id);
        n += 1;
        dayPins.push({ id: place.id, lat: place.lat, lng: place.lng, color: day.color, label: String(n) });
      }
      return {
        pins: [...dayPins, hotelPin],
        route: path,
        routeColor: day.color,
        legend: "המספרים לפי סדר היום",
      };
    }
    if (filter === "all") {
      const seen = new Set<string>([HOTEL_ID]);
      const all: Pin[] = [];
      trip.days.forEach((d, i) => {
        for (const stop of d.stops) {
          const place = stop.placeId ? places.get(stop.placeId) : undefined;
          if (!place || seen.has(place.id) || place.category === "transport") continue;
          seen.add(place.id);
          all.push({ id: place.id, lat: place.lat, lng: place.lng, color: d.color, label: String(i + 1), small: true });
        }
      });
      return { pins: [...all, hotelPin], route: [], routeColor: "", legend: "המספר על הנקודה הוא היום" };
    }
    if (filter === "kosher") {
      const kosher = allPlaces(trip)
        .filter(isKosher)
        .map((p): Pin => ({ id: p.id, lat: p.lat, lng: p.lng, color: KOSHER_GREEN, icon: "kosher" }));
      return { pins: [...kosher, hotelPin], route: [], routeColor: "", legend: "רוב הכשרים ברובע היהודי, 10 דק' מהמלון" };
    }
    const ideas = IDEAS.filter((p) => p.lat > 47.4 && p.lat < 47.6).map(
      (p): Pin => ({ id: p.id, lat: p.lat, lng: p.lng, color: IDEA_INK, icon: "idea", small: true }),
    );
    return { pins: [...ideas, hotelPin], route: [], routeColor: "", legend: "לוחצים על נקודה כדי להוסיף לתוכנית" };
    // hotelPin is derived from places, already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, trip, places]);

  /** First tap starts live tracking; later taps bring the map back to you. */
  function locate() {
    if (watch.current !== null) {
      setFollow(true);
      return;
    }
    if (!navigator.geolocation) {
      toast("הטלפון לא מאפשר מיקום");
      return;
    }
    setFollow(true);
    watch.current = navigator.geolocation.watchPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => {
        if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
        watch.current = null;
        setFollow(false);
        toast("צריך לאשר גישה למיקום בטלפון");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }

  /** "כ־8 דק' הליכה ממך", while we know where you are. */
  function fromMe(place: Place): string | null {
    if (!me) return null;
    const km = distanceKm(me, place) * 1.3;
    if (km > 3) return `${km.toFixed(1)} ק״מ ממך`;
    return `כ־${Math.max(1, Math.round((km / 4.2) * 60))} דק' הליכה ממך`;
  }

  const chips: { id: Filter; label: string; color?: string }[] = [
    ...trip.days.map((d, i) => ({ id: d.id, label: `יום ${i + 1}`, color: d.color })),
    { id: "all", label: "כל הימים", color: "#111111" },
    { id: "kosher", label: "אוכל כשר", color: KOSHER_GREEN },
    { id: "ideas", label: "רעיונות", color: "#3b3b3b" },
  ];

  return (
    <div className="map-page">
      <div className="map-filters">
        <div className="chip-row" role="group" aria-label="מה להציג">
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
              }}
            >
              {c.color && <span className="dot" />}
              {c.label}
            </button>
          ))}
        </div>
        <p className="map-legend">
          <Info size={14} aria-hidden /> {legend}
        </p>
      </div>
      <div className="map-canvas">
        <MapCanvas
          pins={pins}
          route={route}
          routeColor={routeColor}
          fitKey={filter}
          me={me}
          follow={follow}
          onUnfollow={() => setFollow(false)}
          onSelect={(id) => setSelected(places.get(id) ?? null)}
        />
        {!selected && (
          <button
            type="button"
            className="btn btn-outline map-locate"
            aria-pressed={follow}
            onClick={locate}
          >
            <LocateFixed size={20} /> {!me ? "איפה אני?" : follow ? "עוקב אחריכם" : "חזרה אליי"}
          </button>
        )}
        {selected && (
          <div className="card map-card" role="dialog" aria-label={selected.name}>
            <div className="map-card-top">
              <Photo place={selected} className="stop-thumb" iconSize={26} />
              <div className="stop-info" style={{ flex: 1 }}>
                <span className="stop-title">{selected.name}</span>
                {selected.local !== selected.name && <span className="stop-local latin">{selected.local}</span>}
                {fromMe(selected) && (
                  <span className="map-from-me">
                    <Footprints size={14} aria-hidden /> {fromMe(selected)}
                  </span>
                )}
                <Tags tags={selected.tags?.filter((t) => t === "kosher" || t === "nonKosher" || t === "booking")} />
              </div>
              <button type="button" className="icon-btn" aria-label="סגירה" onClick={() => setSelected(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="btn-row">
              <a className="btn btn-primary" href={directionsUrl(selected)} target="_blank" rel="noreferrer">
                <Navigation size={20} /> ניווט
              </a>
              <button type="button" className="btn btn-outline" onClick={() => setDetails(selected)}>
                פרטים
              </button>
            </div>
          </div>
        )}
      </div>
      {details && <PlaceSheet place={details} onClose={() => setDetails(null)} />}
    </div>
  );
}
