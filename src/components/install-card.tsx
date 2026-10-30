"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EllipsisVertical, Share, Smartphone, SquarePlus } from "lucide-react";
import { usePlatform } from "./ui";

type InstallPrompt = Event & { prompt: () => Promise<void> };

const noSubscribe = () => () => {};
const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** How to put the app on the home screen, until it's there. */
export function InstallCard() {
  // Hidden during server render, and for good once opened from the home screen.
  const installed = useSyncExternalStore(noSubscribe, isStandalone, () => true);
  const platform = usePlatform();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    // Android Chrome offers a one-tap install instead of the menu steps.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  return (
    <div className="card card-pad stack install-card">
      <div className="install-head">
        <span className="badge-icon">
          <Smartphone size={20} aria-hidden />
        </span>
        <strong>להוסיף את האפליקציה למסך הבית</strong>
      </div>
      <p className="muted">כך היא נפתחת במסך מלא כמו אפליקציה רגילה, ועובדת גם בלי אינטרנט.</p>
      {prompt ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            await prompt.prompt();
            setPrompt(null);
          }}
        >
          <SquarePlus size={18} aria-hidden /> הוספה למסך הבית
        </button>
      ) : platform === "android" ? (
        <ol className="steps">
          <li>
            <span>
              בכרום לוחצים על שלוש הנקודות <EllipsisVertical size={16} aria-label="תפריט" /> למעלה.
            </span>
          </li>
          <li>בוחרים „הוספה למסך הבית” או „התקנת אפליקציה”.</li>
        </ol>
      ) : (
        <ol className="steps">
          <li>
            <span>
              בספארי לוחצים על כפתור השיתוף <Share size={16} aria-label="שיתוף" /> בתחתית המסך.
            </span>
          </li>
          <li>
            <span>
              גוללים ובוחרים „הוספה למסך הבית” <SquarePlus size={16} aria-hidden />
            </span>
          </li>
        </ol>
      )}
    </div>
  );
}
