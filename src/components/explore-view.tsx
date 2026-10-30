"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, Search } from "lucide-react";
import { PlaceSheet } from "./place-sheet";
import { Photo } from "./ui";
import { allPlaces, CATEGORY_LABELS, isKosher, plannedIds, TAG_LABELS } from "@/lib/catalog";
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

/** Places are grouped by kind, in this order. */
const SECTION_ORDER: Category[] = ["sight", "jewish", "food", "cafe", "market", "bath", "experience", "shopping"];

/** One choice at a time. */
const FILTERS: Filter[] = [
  { id: "all", label: "הכול", match: () => true },
  { id: "sight", label: "אתרים", match: (p) => p.category === "sight" || p.category === "jewish" },
  { id: "food", label: "אוכל", match: (p) => p.category === "food" },
  { id: "cafe", label: "קפה ומתוקים", match: (p) => p.category === "cafe" },
  { id: "kosher", label: "כשר", match: isKosher, color: "#1f6a3f" },
  { id: "christmas", label: "כריסמס", match: (p) => !!p.tags?.includes("christmas") },
  {
    id: "experience",
    label: "חוויות",
    match: (p) => ["experience", "bath", "market", "shopping"].includes(p.category),
  },
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

/** One place: photo, name, and a single short line (visit length, kosher). */
function PlaceRow({ place, onOpen }: { place: Place; onOpen: (p: Place) => void }) {
  const kosher = isKosher(place);
  return (
    <button type="button" className="idea-row" onClick={() => onOpen(place)}>
      <Photo place={place} className="idea-thumb" iconSize={26} />
      <span className="grow">
        <span className="idea-title">{place.name}</span>
        {(kosher || place.duration) && (
          <span className="idea-meta">
            {kosher && <span className="idea-kosher">{TAG_LABELS.kosher}</span>}
            {place.duration}
          </span>
        )}
      </span>
      <ChevronLeft size={20} aria-hidden className="idea-chevron" />
    </button>
  );
}

export function ExploreView() {
  const trip = useTrip();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Place | null>(null);

  const planned = useMemo(() => plannedIds(trip), [trip]);
  const searching = query.trim() !== "";

  const sections = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();
    // New ideas first; what's already in the plan goes in its own folded row.
    const rank = (p: Place) => (IDEA_IDS.has(p.id) ? 0 : 1);
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
    return SECTION_ORDER.map((category) => {
      const places = list.filter((p) => p.category === category);
      return {
        category,
        fresh: places.filter((p) => !planned.has(p.id)),
        inPlan: places.filter((p) => planned.has(p.id)),
      };
    }).filter((section) => section.fresh.length + section.inPlan.length > 0);
  }, [trip, planned, filter, query]);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">מקומות</h1>
        <p className="page-lead">לוחצים על מקום ומוסיפים אותו לאחד הימים.</p>
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
      <div className="idea-chips" role="group" aria-label="סינון">
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

      {sections.map(({ category, fresh, inPlan }) => (
        <section key={category} className="idea-section" aria-label={CATEGORY_LABELS[category]}>
          <h2 className="idea-section-title">
            {CATEGORY_LABELS[category]} <span className="count">{fresh.length + inPlan.length}</span>
          </h2>
          <div className="card idea-list">
            {fresh.map((place) => (
              <PlaceRow key={place.id} place={place} onOpen={setOpen} />
            ))}
            {inPlan.length > 0 && (
              // Folded, unless the person is searching for something by name.
              <details className="idea-planned-group" open={searching || undefined}>
                <summary className="idea-planned-head">
                  <CalendarCheck size={20} aria-hidden />
                  <span className="grow">כבר בתוכנית ({inPlan.length})</span>
                </summary>
                {inPlan.map((place) => (
                  <PlaceRow key={place.id} place={place} onOpen={setOpen} />
                ))}
              </details>
            )}
          </div>
        </section>
      ))}
      {sections.length === 0 && <p className="empty">לא נמצאו מקומות.</p>}

      {open && <PlaceSheet place={open} onClose={() => setOpen(null)} />}
    </>
  );
}
