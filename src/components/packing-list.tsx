"use client";

import Link from "next/link";
import { Check, ListChecks } from "lucide-react";
import { Topic } from "./topic";
import { updateSettings, useSettings } from "@/lib/store";

type Item = { id: string; label: string; hint?: string; href?: string };

const ITEMS: Item[] = [
  { id: "passports", label: "דרכונים" },
  { id: "insurance", label: "ביטוח נסיעות" },
  { id: "card", label: "כרטיס אשראי" },
  { id: "esim", label: "eSIM מותקן", href: "/esim" },
  { id: "bolt", label: "אפליקציית Bolt מותקנת" },
  { id: "charger", label: "מטען וסוללה ניידת" },
  { id: "meds", label: "תרופות קבועות" },
  { id: "coat", label: "מעיל, כפפות וכובע" },
  { id: "shoes", label: "נעליים נוחות להליכה" },
  { id: "adapter", label: "מתאם לשקע", hint: "רק לתקע עם שלושה פינים" },
];

/** The "before the flight" checklist. Ticks are saved per phone, in the settings. */
export function PackingList() {
  const { packed = [] } = useSettings();
  const known = ITEMS.filter((item) => packed.includes(item.id)).length;

  function toggle(id: string) {
    updateSettings({ packed: packed.includes(id) ? packed.filter((x) => x !== id) : [...packed, id] });
  }

  return (
    <Topic
      id="packing"
      icon={<ListChecks size={22} aria-hidden />}
      title="רשימה לפני הטיסה"
      hint={`${known} מתוך ${ITEMS.length}`}
      flush
    >
      <ul className="pack-list">
        {ITEMS.map((item) => {
          const done = packed.includes(item.id);
          return (
            <li key={item.id} className={`pack-item${done ? " is-done" : ""}`}>
              <button type="button" role="checkbox" aria-checked={done} className="pack-toggle" onClick={() => toggle(item.id)}>
                <span className="pack-box" aria-hidden>
                  {done && <Check size={22} strokeWidth={3} />}
                </span>
                <span className="grow">
                  <span className="pack-label">{item.label}</span>
                  {item.hint && <span className="pack-hint">{item.hint}</span>}
                </span>
              </button>
              {item.href && (
                <Link href={item.href} className="pack-link">
                  למדריך
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </Topic>
  );
}
