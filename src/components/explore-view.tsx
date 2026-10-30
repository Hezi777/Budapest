"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, Search } from "lucide-react";
import { PlaceSheet } from "./place-sheet";
import { Photo, Tags } from "./ui";
import { allPlaces, CATEGORY_LABELS, isKosher, plannedIds } from "@/lib/catalog";
import { IDEAS } from "@/lib/ideas";
import { useTrip } from "@/lib/store";
import type { Category, Place } from "@/lib/types";

const IDEA_IDS = new Set(IDEAS.map((p) => p.id));

type Filter = {
  id: string;
  label: string;
  match: (p: Place) => boolean;
  color?: string;
};

/** Ideas are grouped by kind, in this order. */
const SECTION_ORDER: Category[] = ["sight", "jewish", "food", "cafe", "market", "bath", "experience", "shopping"];

const FILTERS: Filter[] = [
  { id: "all", label: "הכול", match: () => true },
  { id: "kosher", label: "אוכל כשר", match: isKosher, color: "#1f6a3f" },
  { id: "sight", label: "אתרים", match: (p) => p.category === "sight" || p.category === "jewish" },
  { id: "food", label: "אוכל וקפה", match: (p) => p.category === "food" || p.category === "cafe" },
  { id: "christmas", label: "כריסמס", match: (p) => !!p.tags?.includes("christmas") },
];

function KosherNote() {
  return (
    <div className="card card-pad stack" style={{ marginBlockEnd: 16, background: "var(--tag-kosher-bg)" }}>
      <strong style={{ fontSize: "1.05rem" }}>לפני שיוצאים לאכול כשר</strong>
      <p>
        כמעט כל המקומות הכשרים נמצאים ברובע היהודי, 10 דקות הליכה מהמלון. הם נסגרים בשישי בצהריים ופותחים
        שוב במוצאי שבת או ביום ראשון.
      </p>
      <p>
        <strong>ארוחות שבת:</strong> בכרמל ובחנה מגישים ארוחת ליל שבת וצהרי שבת רק בהזמנה ובתשלום מראש (עד
        שישי ב־14:00). כדאי להזמין כבר עכשיו.
      </p>
      <p className="small muted">השעות משתנות. כדאי להתקשר לפני, ולבקש לראות תעודת כשרות.</p>
    </div>
  );
}

export function ExploreView() {
  const trip = useTrip();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Place | null>(null);

  const planned = useMemo(() => plannedIds(trip), [trip]);

  const sections = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();
    // Fresh ideas first, then the rest, and what's already planned last.
    const rank = (p: Place) => (planned.has(p.id) ? 2 : IDEA_IDS.has(p.id) ? 0 : 1);
    const list = allPlaces(trip)
      .filter((p) => p.category !== "transport" && p.category !== "hotel")
      .filter(f.match)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.local.toLowerCase().includes(q) ||
          p.description.includes(q),
      )
      .sort((a, b) => rank(a) - rank(b));
    return SECTION_ORDER.map((category) => ({
      category,
      places: list.filter((p) => p.category === category),
    })).filter((section) => section.places.length > 0);
  }, [trip, planned, filter, query]);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">רעיונות</h1>
        <p className="page-lead">עוד מקומות שכדאי להכיר. לוחצים על מקום ומוסיפים אותו לאחד הימים.</p>
      </div>

      <div className="search" style={{ marginBlockEnd: 10 }}>
        <Search size={20} />
        <input
          className="input"
          type="search"
          value={query}
          placeholder="חיפוש: שוק, קפה, בית כנסת…"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש מקום"
        />
      </div>
      <div className="chip-row" role="group" aria-label="סינון" style={{ marginBlockEnd: 12 }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip"
            aria-pressed={filter === f.id}
            style={f.color ? ({ "--chip": f.color } as React.CSSProperties) : undefined}
            onClick={() => setFilter(f.id)}
          >
            {f.color && <span className="dot" />}
            {f.label}
          </button>
        ))}
      </div>

      {filter === "kosher" && <KosherNote />}

      {sections.map(({ category, places }) => (
        <section key={category} className="idea-section" aria-label={CATEGORY_LABELS[category]}>
          <h2 className="idea-section-title">
            {CATEGORY_LABELS[category]} <span className="count">{places.length}</span>
          </h2>
          <div className="card idea-list">
            {places.map((place) => (
              <button key={place.id} type="button" className="idea-row" onClick={() => setOpen(place)}>
                <Photo place={place} className="idea-thumb" iconSize={26} />
                <span className="grow">
                  {place.duration && <span className="idea-meta">{place.duration}</span>}
                  <span className="idea-title">{place.name}</span>
                  {planned.has(place.id) ? (
                    <span className="idea-planned">
                      <CalendarCheck size={14} aria-hidden /> כבר בתוכנית
                    </span>
                  ) : (
                    <Tags tags={place.tags?.filter((t) => t === "kosher" || t === "free")} />
                  )}
                </span>
                <ChevronLeft size={20} aria-hidden className="idea-chevron" />
              </button>
            ))}
          </div>
        </section>
      ))}
      {sections.length === 0 && <p className="empty">לא נמצאו מקומות.</p>}

      {open && <PlaceSheet place={open} onClose={() => setOpen(null)} />}
    </>
  );
}
