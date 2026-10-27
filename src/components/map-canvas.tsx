"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, CircleMarker, useMap } from "react-leaflet";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label?: string;
  small?: boolean;
  hotel?: boolean;
};

const BUDAPEST: [number, number] = [47.4979, 19.0502];

function pinIcon(pin: Pin) {
  const size = pin.small ? 26 : 36;
  const classes = ["map-pin", pin.small && "is-small", pin.hotel && "is-hotel"].filter(Boolean).join(" ");
  return L.divIcon({
    className: "",
    html: `<div class="${classes}" style="--pin:${pin.color}"><span>${pin.label ?? ""}</span></div>`,
    iconSize: [size, size],
    // The pin's point sits at its bottom-left corner before the 45° turn.
    iconAnchor: [size / 2, size * 1.2],
  });
}

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

function FlyTo({ to }: { to: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (to) map.flyTo(to, 16);
  }, [to, map]);
  return null;
}

export default function MapCanvas({
  pins,
  route,
  routeColor,
  fitKey,
  me,
  onSelect,
}: {
  pins: Pin[];
  route: [number, number][];
  routeColor: string;
  fitKey: string;
  me: [number, number] | null;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer center={BUDAPEST} zoom={14} zoomControl={false} style={{ height: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {route.length > 1 && (
        <Polyline positions={route} pathOptions={{ color: routeColor, weight: 4, opacity: 0.7, dashArray: "2 10", lineCap: "round" }} />
      )}
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={pinIcon(pin)}
          zIndexOffset={pin.hotel ? 1000 : pin.small ? 0 : 500}
          eventHandlers={{ click: () => onSelect(pin.id) }}
        />
      ))}
      {me && (
        <CircleMarker center={me} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#1a73e8", fillOpacity: 1 }} />
      )}
      <FitBounds pins={pins} fitKey={fitKey} />
      <FlyTo to={me} />
    </MapContainer>
  );
}
