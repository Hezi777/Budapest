"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import maplibregl, { type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
import { BedDouble, Check, Star } from "lucide-react";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
  /** Read out by screen readers. */
  name?: string;
  /** A Lucide glyph instead of a label. */
  icon?: "hotel" | "kosher" | "idea";
  small?: boolean;
};

/** Where the phone is, from the GPS. */
export type Me = { lat: number; lng: number; accuracy: number };

const BUDAPEST: [number, number] = [19.0502, 47.4979]; // lng, lat

/**
 * OpenFreeMap's public "liberty" style: free, no key, no limits. Its
 * attribution (OpenFreeMap, OpenMapTiles, OpenStreetMap) comes from the tile
 * source, so MapLibre shows it by itself. https://openfreemap.org/quick_start/
 */
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/** If the real style can't load (offline, blocked), a plain ground keeps pins and the route usable. */
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#eef0ea" } }],
};

const ME_BLUE = "#1a73e8";

const GLYPHS = {
  hotel: renderToStaticMarkup(<BedDouble size={17} strokeWidth={2.4} />),
  kosher: renderToStaticMarkup(<Check size={16} strokeWidth={3} />),
  idea: renderToStaticMarkup(<Star size={13} strokeWidth={2.6} />),
};

function pinElement(pin: Pin) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = ["map-pin", pin.small && "is-small", pin.icon && `is-${pin.icon}`].filter(Boolean).join(" ");
  el.style.setProperty("--pin", pin.color);
  // HTML markers stack in DOM order; keep the hotel, then the day's stops, on top.
  el.style.zIndex = pin.icon === "hotel" ? "3" : pin.small ? "1" : "2";
  if (pin.name) el.setAttribute("aria-label", pin.name);
  if (pin.icon) el.innerHTML = GLYPHS[pin.icon];
  else {
    const span = document.createElement("span");
    span.textContent = pin.label ?? "";
    el.append(span);
  }
  return el;
}

/** A circle of `meters` around a point, as a GeoJSON polygon (the GPS accuracy). */
function circle(lat: number, lng: number, meters: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const ring: [number, number][] = [];
  const dLat = meters / 111_320;
  const dLng = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/** Adds the source the first time, then just swaps its data. */
function setData(map: maplibregl.Map, id: string, data: GeoJSON.GeoJSON) {
  const source = map.getSource<GeoJSONSource>(id);
  if (source) source.setData(data);
  else map.addSource(id, { type: "geojson", data });
}

/**
 * MapLibre corners are physical. Zoom goes on the reading-start side, across
 * from "איפה אני?"; the credit on the end side, under that button.
 */
function corners(el: HTMLElement) {
  const rtl = getComputedStyle(el).direction === "rtl";
  return { start: rtl ? "bottom-right" : "bottom-left", end: rtl ? "bottom-left" : "bottom-right" } as const;
}

export default function MapCanvas({
  pins,
  route,
  routeColor,
  fitKey,
  topInset,
  me,
  follow,
  onUnfollow,
  onSelect,
}: {
  pins: Pin[];
  route: [number, number][];
  routeColor: string;
  fitKey: string;
  /** The filter chips above the map; pins are fitted below them. */
  topInset: RefObject<HTMLElement | null>;
  me: Me | null;
  follow: boolean;
  onUnfollow: () => void;
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const failed = useRef<HTMLParagraphElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const meMarker = useRef<maplibregl.Marker | null>(null);
  const fitted = useRef(false);
  // Bumped on every style load; overlay layers are (re)added after it.
  const [styleGen, setStyleGen] = useState(0);

  const unfollow = useEffectEvent(() => onUnfollow());
  const select = useEffectEvent((id: string) => onSelect(id));

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: el,
        style: STYLE_URL,
        center: BUDAPEST,
        zoom: 13,
        minZoom: 9,
        maxZoom: 19,
        // A flat, north-up map: nothing to get lost in.
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        maxPitch: 0,
        // Full-screen map: one finger pans, no "use two fingers" overlay.
        cooperativeGestures: false,
        attributionControl: false,
        locale: {
          "NavigationControl.ZoomIn": "הגדלה",
          "NavigationControl.ZoomOut": "הקטנה",
          "AttributionControl.ToggleAttribution": "מקור המפה",
        },
      });
    } catch {
      // No WebGL: say so instead of a blank screen.
      if (failed.current) failed.current.hidden = false;
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    const { start, end } = corners(el);
    // Compact: the full credit shows at first, then folds into an "i" once the map is dragged.
    map.addControl(new maplibregl.AttributionControl({ compact: true }), end);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), start);

    let loaded = false;
    map.on("style.load", () => {
      loaded = true;
      setStyleGen((g) => g + 1);
    });
    // A listener also keeps MapLibre from logging every blocked tile.
    map.on("error", () => {
      if (loaded) return;
      loaded = true;
      map.setStyle(FALLBACK_STYLE, { diff: false });
    });
    map.on("dragstart", () => unfollow());

    return () => {
      map.remove();
      mapRef.current = null;
      meMarker.current = null;
      fitted.current = false;
    };
  }, []);

  // Pins: HTML markers, rebuilt when the filter changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = pins.map((pin) => {
      const el = pinElement(pin);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        select(pin.id);
      });
      return new maplibregl.Marker({ element: el }).setLngLat([pin.lng, pin.lat]).addTo(map);
    });
    return () => markers.forEach((m) => m.remove());
  }, [pins]);

  // The day's route: the day colour over a white casing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleGen === 0) return;
    const line: GeoJSON.GeoJSON =
      route.length > 1
        ? {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: route.map(([lat, lng]) => [lng, lat]) },
          }
        : EMPTY;
    setData(map, "route", line);
    const layout = { "line-cap": "round", "line-join": "round" } as const;
    if (!map.getLayer("route-casing")) {
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout,
        paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.95 },
      });
      map.addLayer({ id: "route-line", type: "line", source: "route", layout, paint: { "line-width": 5 } });
    }
    if (routeColor) map.setPaintProperty("route-line", "line-color", routeColor);
  }, [route, routeColor, styleGen]);

  // GPS accuracy: a soft blue circle on the map itself, so it scales with zoom.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleGen === 0) return;
    setData(map, "me-accuracy", me ? circle(me.lat, me.lng, me.accuracy) : EMPTY);
    if (!map.getLayer("me-accuracy")) {
      map.addLayer({
        id: "me-accuracy",
        type: "fill",
        source: "me-accuracy",
        paint: { "fill-color": ME_BLUE, "fill-opacity": 0.1, "fill-outline-color": ME_BLUE },
      });
    }
  }, [me, styleGen]);

  // The blue dot.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!me) {
      meMarker.current?.remove();
      meMarker.current = null;
      return;
    }
    if (!meMarker.current) {
      const el = document.createElement("div");
      el.className = "map-me";
      el.style.zIndex = "4";
      el.append(document.createElement("span"));
      meMarker.current = new maplibregl.Marker({ element: el });
    }
    meMarker.current.setLngLat([me.lng, me.lat]).addTo(map);
  }, [me]);

  // Fit the pins when the filter changes, clear of the chips and the bottom nav.
  const fit = useEffectEvent(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const p of pins) bounds.extend([p.lng, p.lat]);
    const top = (topInset.current?.offsetHeight ?? 100) + 24;
    const nav = parseFloat(getComputedStyle(map.getContainer()).getPropertyValue("--nav-height")) || 68;
    const padding = { top, bottom: nav + 112, left: 40, right: 40 };
    const { height } = map.getContainer().getBoundingClientRect();
    // On a very short screen the padding would leave no room; fall back to a plain margin.
    const safe = height - top - padding.bottom > 120 ? padding : 40;
    map.fitBounds(bounds, { padding: safe, maxZoom: 16, duration: fitted.current ? 600 : 0 });
    fitted.current = true;
  });
  useEffect(() => fit(), [fitKey]);

  // Follow the phone until the user drags the map.
  const lat = me?.lat;
  const lng = me?.lng;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !follow || lat === undefined || lng === undefined) return;
    map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 16), duration: 600 });
  }, [follow, lat, lng]);

  return (
    <>
      <div ref={container} className="map-gl" />
      <p ref={failed} className="map-failed" hidden>
        המפה לא נטענה בטלפון הזה. אפשר לנווט מכרטיס של כל מקום.
      </p>
    </>
  );
}
