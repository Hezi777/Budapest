"use client";

import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { BedDouble, Check, Star } from "lucide-react";
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
  /** A Lucide glyph instead of a label. */
  icon?: "hotel" | "kosher" | "idea";
  small?: boolean;
};

/** Where the phone is, from the GPS. */
export type Me = { lat: number; lng: number; accuracy: number };

const BUDAPEST: [number, number] = [47.4979, 19.0502];

const GLYPHS = {
  hotel: renderToStaticMarkup(<BedDouble size={17} strokeWidth={2.4} />),
  kosher: renderToStaticMarkup(<Check size={16} strokeWidth={3} />),
  idea: renderToStaticMarkup(<Star size={13} strokeWidth={2.6} />),
};

function pinIcon(pin: Pin) {
  const size = pin.small ? 28 : 34;
  const classes = ["map-pin", pin.small && "is-small", pin.icon && `is-${pin.icon}`].filter(Boolean).join(" ");
  const inner = pin.icon ? GLYPHS[pin.icon] : `<span>${pin.label ?? ""}</span>`;
  return L.divIcon({
    className: "",
    html: `<div class="${classes}" style="--pin:${pin.color}">${inner}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const meIcon = L.divIcon({
  className: "",
  html: '<div class="map-me"><span></span></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FitBounds({ pins, fitKey }: { pins: Pin[]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
    // Refit only when the filter changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

/** Keeps the map on the phone while following; a drag hands control back. */
function Follow({ me, follow, onUnfollow }: { me: Me | null; follow: boolean; onUnfollow: () => void }) {
  const map = useMap();
  useMapEvents({ dragstart: onUnfollow });
  const lat = me?.lat;
  const lng = me?.lng;
  useEffect(() => {
    if (!follow || lat === undefined || lng === undefined) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [follow, lat, lng, map]);
  return null;
}

export default function MapCanvas({
  pins,
  route,
  routeColor,
  fitKey,
  me,
  follow,
  onUnfollow,
  onSelect,
}: {
  pins: Pin[];
  route: [number, number][];
  routeColor: string;
  fitKey: string;
  me: Me | null;
  follow: boolean;
  onUnfollow: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer center={BUDAPEST} zoom={14} zoomControl={false} style={{ height: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {route.length > 1 && (
        <>
          {/* A white casing keeps the day's line readable over busy streets. */}
          <Polyline positions={route} pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
          <Polyline positions={route} pathOptions={{ color: routeColor, weight: 4, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
        </>
      )}
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={pinIcon(pin)}
          zIndexOffset={pin.icon === "hotel" ? 1000 : pin.small ? 0 : 500}
          eventHandlers={{ click: () => onSelect(pin.id) }}
        />
      ))}
      {me && (
        <>
          <Circle
            center={[me.lat, me.lng]}
            radius={me.accuracy}
            pathOptions={{ color: "#1a73e8", weight: 1, opacity: 0.3, fillColor: "#1a73e8", fillOpacity: 0.1 }}
            interactive={false}
          />
          <Marker position={[me.lat, me.lng]} icon={meIcon} zIndexOffset={2000} interactive={false} />
        </>
      )}
      <FitBounds pins={pins} fitKey={fitKey} />
      <Follow me={me} follow={follow} onUnfollow={onUnfollow} />
    </MapContainer>
  );
}
