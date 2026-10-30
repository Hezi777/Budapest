"use client";

import { useState, useSyncExternalStore } from "react";
import { Photo } from "./ui";
import { HERO } from "@/lib/places";
import { updateSettings, useSettings, type TextSize } from "@/lib/store";

const noop = () => () => {};

const SIZES: { id: TextSize; label: string }[] = [
  { id: "normal", label: "רגיל" },
  { id: "large", label: "גדול" },
  { id: "xlarge", label: "גדול מאוד" },
];

/** A one-time greeting for Edna and Benny, shown on their first visit. */
export function Welcome() {
  const { welcomed, textSize } = useSettings();
  // Client only: the server can't know whether this phone has seen it.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [leaving, setLeaving] = useState(false);

  if (!hydrated || welcomed) return null;

  function start() {
    setLeaving(true);
    setTimeout(() => updateSettings({ welcomed: true }), 200);
  }

  return (
    <div className={`welcome${leaving ? " is-leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <Photo place={HERO} width={1280} iconSize={0} />
      <div className="welcome-text">
        <p className="welcome-dates">26–29 בנובמבר · בודפשט</p>
        <h1 id="welcome-title" className="welcome-title">
          תהנו מהטיול,
          <br />
          עדנה ובני!
        </h1>
        <p className="welcome-lead">
          כל מה שצריך לטיול נמצא כאן: התוכנית לכל יום, ניווט, המרת כסף וטלפונים לחירום.
        </p>
        <div className="welcome-size">
          <span id="welcome-size-label" className="welcome-size-label">
            גודל הטקסט
          </span>
          <div className="segmented" role="group" aria-labelledby="welcome-size-label">
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
        <button type="button" className="btn btn-block welcome-btn" onClick={start} autoFocus>
          יאללה, מתחילים
        </button>
        <p className="welcome-sign">באהבה, חן</p>
      </div>
    </div>
  );
}
