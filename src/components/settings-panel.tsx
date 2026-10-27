"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useToast } from "./ui";
import { resetTrip, updateSettings, useSettings, type TextSize } from "@/lib/store";

const SIZES: { id: TextSize; label: string }[] = [
  { id: "normal", label: "רגיל" },
  { id: "large", label: "גדול" },
  { id: "xlarge", label: "גדול מאוד" },
];

export function SettingsPanel() {
  const { textSize } = useSettings();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);

  function reset() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    resetTrip();
    setConfirm(false);
    toast("התוכנית חזרה למקור");
  }

  return (
    <div className="card" style={{ padding: "4px 20px" }}>
      <div className="settings-row">
        <strong>גודל הטקסט</strong>
        <div className="segmented" role="group" aria-label="גודל הטקסט">
          {SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={textSize === s.id}
              onClick={() => updateSettings({ textSize: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-row">
        <strong>שינויים בתוכנית</strong>
        <p className="muted small">
          כל שינוי נשמר בטלפון הזה בלבד. כדי לשתף, משתמשים בכפתור „שליחת היום בוואטסאפ” בדף התוכנית.
        </p>
        <button type="button" className="secondary-button danger-button" onClick={reset}>
          <RotateCcw size={20} /> {confirm ? "בטוח? ללחוץ שוב" : "החזרת התוכנית למקור"}
        </button>
      </div>
    </div>
  );
}
