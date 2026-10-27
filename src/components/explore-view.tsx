"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Navigation, Search } from "lucide-react";
import { PlaceSheet } from "./place-sheet";
import { Photo, Tags } from "./ui";
import { allPlaces, isKosher, plannedIds } from "@/lib/catalog";
import { directionsUrl } from "@/lib/geo";
import { IDEAS } from "@/lib/ideas";
import { useTrip } from "@/lib/store";
import type { Place } from "@/lib/types";

const IDEA_IDS = new Set(IDEAS.map((p) => p.id));

type Filter = {
  id: string;
  label: string;
  match: (p: Place) => boolean;
  color?: string;
};

const FILTERS: Filter[] = [
  { id: "all", label: "הכול", match: () => true },
  { id: "kosher", label: "אוכל כשר", match: isKosher, color: "#24603d" },
  { id: "christmas", label: "כריסמס", match: (p) => !!p.tags?.includes("christmas"), color: "#9d2323" },
  { id: "sight", label: "אתרים ונוף", match: (p) => p.category === "sight" },
  { id: "jewish", label: "מורשת יהודית", match: (p) => p.category === "jewish" },
  { id: "cafe", label: "קפה ומתוקים", match: (p) => p.category === "cafe" },
  { id: "food", label: "מסעדות", match: (p) => p.category === "food" },
  { id: "bath", label: "מרחצאות", match: (p) => p.category === "bath" },
  { id: "experience", label: "חוויות", match: (p) => p.category === "experience" },
  { id: "shopping", label: "קניות ושווקים", match: (p) => p.category === "shopping" || p.category === "market" },
];

function KosherNote() {
  return (
    <div className="tool-panel" style={{ display: "grid", gap: 8, marginBlockEnd: 14 }}>
      <strong>לפני שיוצאים לאכול כשר</strong>
      <p>
        כמעט כל המקומות הכשרים נמצאים ברובע היהודי, 10 דקות הליכה מהמלון. הם נסגרים בשישי בצהריים ופותחים
        שוב במוצאי שבת או ביום ראשון.
      </p>
      <p>
        <strong>ארוחות שבת:</strong> בכרמל ובחנה מגישים ארוחת ליל שבת וצהרי שבת רק בהזמנה ובתשלום מראש
        (עד שישי ב־14:00). כדאי להזמין כבר עכשיו.
      </p>
      <p className="small muted">השעות משתנות. כדאי להתקשר לוודא לפני שהולכים, ולבקש לראות תעודת כשרות.</p>
    </div>
  );
}

export function ExploreView() {
  const trip = useTrip();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Place | null>(null);
  const planned = plannedIds(trip);

  const rank = (p: Place) => (planned.has(p.id) ? 2 : IDEA_IDS.has(p.id) ? 0 : 1);

  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();
    return allPlaces(trip)
      .filter((p) => p.category !== "transport" && p.category !== "hotel")
      .filter(f.match)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.local.toLowerCase().includes(q) ||
          p.description.includes(q),
      )
      // Fresh ideas first, then the rest, and what's already planned last.
      .sort((a, b) => rank(a) - rank(b));
    // planned is derived from trip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, filter, query]);

  return (
    <>
      <h1 className="page-title">רעיונות</h1>
      <p className="page-lead">עוד מקומות שכדאי להכיר. לוחצים על מקום כדי לראות פרטים ולהוסיף אותו לאחד הימים.</p>

      <div className="search-field">
        <Search size={20} />
        <input
          className="field-control"
          type="search"
          value={query}
          placeholder="חיפוש מקום"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש מקום"
        />
      </div>
      <div className="chip-row" role="group" aria-label="סינון" style={{ marginBlockEnd: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip"
            aria-pressed={filter === f.id}
            style={f.color ? ({ "--chip": f.color } as React.CSSProperties) : undefined}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "kosher" && <KosherNote />}

      <div className="place-list">
        {list.map((place) => (
          <article key={place.id} className="card place-card">
            <button
              type="button"
              onClick={() => setOpen(place)}
              style={{ all: "unset", display: "block", width: "100%", cursor: "pointer" }}
              aria-label={`פרטים על ${place.name}`}
            >
              <Photo place={place} className="place-card-photo" width={960} iconSize={40} />
              <div className="place-card-body">
                <h2 className="place-card-title">{place.name}</h2>
                {place.local !== place.name && (
                  <div className="stop-local latin" style={{ textAlign: "start" }}>
                    {place.local}
                  </div>
                )}
                <Tags tags={place.tags} />
                <p className="stop-desc">{place.description}</p>
                {place.why && <p className="place-card-why">{place.why}</p>}
                {planned.has(place.id) && (
                  <span className="in-plan">
                    <CalendarCheck size={18} aria-hidden /> כבר בתוכנית
                  </span>
                )}
              </div>
            </button>
            <div className="button-row" style={{ padding: "0 16px 16px" }}>
              <button type="button" className="primary-button ink" onClick={() => setOpen(place)}>
                פרטים והוספה
              </button>
              <a className="secondary-button" href={directionsUrl(place)} target="_blank" rel="noreferrer">
                <Navigation size={20} /> ניווט
              </a>
            </div>
          </article>
        ))}
        {list.length === 0 && <p className="empty">לא נמצאו מקומות.</p>}
      </div>

      {open && <PlaceSheet place={open} onClose={() => setOpen(null)} />}
    </>
  );
}
