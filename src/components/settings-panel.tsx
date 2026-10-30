"use client";

import { useState, type CSSProperties } from "react";
import { RotateCcw } from "lucide-react";
import { useToast } from "./ui";
import { resetTrip, updateSettings, useSettings, type TextSize } from "@/lib/store";

/** `sample` is the size, in px, of the letter shown on each button: a preview of that setting. */
const SIZES: { id: TextSize; label: string; sample: number }[] = [
  { id: "normal", label: "רגיל", sample: 18 },
  { id: "large", label: "גדול", sample: 22 },
  { id: "xlarge", label: "גדול מאוד", sample: 28 },
];

export function SettingsPanel() {
  const { textSize } = useSettings();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);

  function reset() {
    resetTrip();
    setConfirm(false);
    toast("התוכנית חזרה למקור");
  }

  return (
    <div className="settings-panel">
      <div className="settings-row card-pad">
        <strong id="size-title">גודל הטקסט</strong>
        <p className="muted">לוחצים על הגודל שנוח לקרוא. הכול באפליקציה משתנה מיד.</p>
        <div className="segmented size-choice" role="group" aria-labelledby="size-title">
          {SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={textSize === s.id}
              onClick={() => updateSettings({ textSize: s.id })}
            >
              <span className="size-sample" style={{ "--sample": `${s.sample}px` } as CSSProperties} aria-hidden>
                א
              </span>
              {s.label}
            </button>
          ))}
        </div>
        <p className="size-preview">כך ייראה הטקסט באפליקציה: מסעדה כשרה ליד המלון, פתוחה עד 22:00.</p>
      </div>
      <div className="settings-row card-pad">
        <strong>שינויים בתוכנית</strong>
        <p className="muted">
          כל שינוי נשמר בטלפון הזה בלבד. כדי לשתף, משתמשים בכפתור „שליחה בוואטסאפ” בדף התוכנית.
        </p>
        {confirm ? (
          <div className="confirm-box" role="alertdialog" aria-labelledby="reset-q">
            <p id="reset-q">למחוק את כל השינויים שעשיתם ולחזור לתוכנית המקורית?</p>
            <div className="btn-row">
              <button type="button" className="btn btn-outline" onClick={() => setConfirm(false)} autoFocus>
                לא, להשאיר
              </button>
              <button type="button" className="btn btn-danger" onClick={reset}>
                <RotateCcw size={20} aria-hidden /> כן, להחזיר
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>
            <RotateCcw size={20} aria-hidden /> החזרת התוכנית למקור
          </button>
        )}
      </div>
    </div>
  );
}
