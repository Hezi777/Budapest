"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CircleX,
  Copy,
  Download,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { STORE_URL, useToast, type StoreIds } from "./ui";

export function CouponCode({ code, title, note }: { code: string; title: string; note: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast("הקוד הועתק. מדביקים אותו בתשלום");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(code);
    }
  }

  return (
    <div className="coupon">
      <div className="grow">
        <div className="small muted">{title}</div>
        <div className="code latin" style={{ textAlign: "start" }}>
          {code}
        </div>
        <div className="small muted">{note}</div>
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={copy} style={{ flex: "none" }}>
        {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "הועתק" : "העתקה"}
      </button>
    </div>
  );
}

/* ---------- Saved progress (per phone, in localStorage) ---------- */

type Phone = "iphone" | "android";
type Compat = "yes" | "no" | null;
type Progress = { phone: Phone | null; step: number; compat: Compat };

const KEY = "budapest-esim";
const EMPTY: Progress = { phone: null, step: 0, compat: null };

const listeners = new Set<() => void>();
let cache: Progress | undefined;

function isProgress(v: unknown): v is Progress {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Progress;
  return (
    (p.phone === null || p.phone === "iphone" || p.phone === "android") &&
    Number.isInteger(p.step) &&
    p.step >= 0 &&
    (p.compat === null || p.compat === "yes" || p.compat === "no")
  );
}

function read(): Progress {
  if (cache) return cache;
  cache = EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isProgress(parsed)) cache = parsed;
    }
  } catch {
    // Private mode or corrupt data: start from the beginning.
  }
  return cache;
}

function write(patch: Partial<Progress>) {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage blocked: progress still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ---------- Steps ---------- */

type Shot = { src: string; w: number; h: number; alt: string; caption?: string };

type Step = {
  id: string;
  phase: "before" | "landing";
  title: string;
  kind?: "compat" | "coupon" | "done";
  body: React.ReactNode;
  shot?: Shot;
  /** A button for this step, such as the app store link. */
  action?: React.ReactNode;
  /** Extra help, collapsed by default. */
  more?: { summary: string; body: React.ReactNode; shots?: Shot[] };
};

/** A menu path or button name. `en` marks English-only names, which must not break across lines. */
const P = ({ children, en }: { children: React.ReactNode; en?: boolean }) => (
  <span className={en ? "path latin" : "path"}>{children}</span>
);

// Airalo: eSIM Travel & Internet — https://apps.apple.com/app/id1475911720,
// https://play.google.com/store/apps/details?id=com.mobillium.airalo
const AIRALO_APP: StoreIds = { app: "Airalo", ios: "1475911720", android: "com.mobillium.airalo" };

const IN_ENGLISH = "המסך באנגלית. אצלכם הוא יופיע בעברית.";

/*
 * Real screenshots, all from official sources. Each source URL is next to the
 * image it was taken from.
 */
const SHOTS = {
  // Airalo app, "My eSIMs" tab with the orange "Install or share" button.
  // Cropped to the phone screen from the App Store listing screenshot:
  // https://apps.apple.com/us/app/airalo-esim-travel-internet/id1475911720
  airaloInstall: {
    src: "/esim/airalo-install-or-share.webp",
    w: 560,
    h: 647,
    alt: "האפליקציה של Airalo, מסך My eSIMs עם הכפתור הכתום Install or share",
    caption: "דוגמה מהאפליקציה. אצלכם יופיע הכרטיס של הונגריה.",
  },
  // Airalo app, package list of a country (the example is Spain).
  // Cropped from the same App Store listing screenshot:
  // https://apps.apple.com/us/app/airalo-esim-travel-internet/id1475911720
  airaloPackages: {
    src: "/esim/airalo-choose-package.webp",
    w: 560,
    h: 811,
    alt: "האפליקציה של Airalo, רשימת חבילות לפי מספר ימים",
    caption: "דוגמה מהאפליקציה, עם מדינה אחרת. אתם בוחרים Hungary ו־3GB ל־7 ימים.",
  },
  // iPhone Settings > Cellular (iOS 26): https://support.apple.com/en-us/109317
  iphoneCellular: {
    src: "/esim/iphone-settings-cellular.webp",
    w: 560,
    h: 862,
    alt: "אייפון, הגדרות סלולר עם רשימת הקווים",
    caption: IN_ENGLISH,
  },
  // iPhone Cellular Data screen, choosing the line for data: https://support.apple.com/en-us/109317
  iphoneData: {
    src: "/esim/iphone-cellular-data-line.webp",
    w: 560,
    h: 862,
    alt: "אייפון, מסך נתונים סלולריים לבחירת הקו",
    caption: IN_ENGLISH,
  },
  // iPhone line label screen: https://support.apple.com/en-us/109317
  iphoneLabel: {
    src: "/esim/iphone-esim-label.webp",
    w: 560,
    h: 862,
    alt: "אייפון, מסך שמות לקו עם האפשרות Custom",
    caption: IN_ENGLISH,
  },
  // iPhone Settings > Cellular > Add eSIM > Use QR Code: https://support.apple.com/en-us/118669
  iphoneQr: {
    src: "/esim/iphone-add-esim-qr.webp",
    w: 560,
    h: 1159,
    alt: "אייפון, מסך Set Up eSIM עם האפשרות Use QR Code",
    caption: IN_ENGLISH,
  },
  // Samsung Settings > Connections > SIM manager > Add eSIM:
  // https://www.samsung.com/us/support/answer/ANS10001619/
  samsungAdd: {
    src: "/esim/samsung-add-esim.webp",
    w: 420,
    h: 325,
    alt: "סמסונג, מנהל SIM עם הכפתור Add eSIM",
    caption: "שלב 1: Add eSIM. " + IN_ENGLISH,
  },
  // Samsung Add eSIM > Scan QR code: https://www.samsung.com/us/support/answer/ANS10001619/
  samsungQr: {
    src: "/esim/samsung-scan-qr.webp",
    w: 420,
    h: 325,
    alt: "סמסונג, האפשרות Scan QR code",
    caption: "שלב 2: Scan QR code. " + IN_ENGLISH,
  },
  // Samsung Settings > Connections (SIM card manager highlighted):
  // https://www.samsung.com/uk/support/mobile-devices/how-to-use-or-manage-dual-sim-cards/
  samsungConnections: {
    src: "/esim/samsung-sim-manager.webp",
    w: 237,
    h: 500,
    alt: "סמסונג, תפריט חיבורים עם מנהל SIM",
    caption: "בטלפון שלכם התפריט עשוי להיראות מעט אחרת.",
  },
  // Samsung SIM card manager, Mobile data selection:
  // https://www.samsung.com/uk/support/mobile-devices/how-to-use-or-manage-dual-sim-cards/
  samsungData: {
    src: "/esim/samsung-mobile-data-sim.webp",
    w: 237,
    h: 500,
    alt: "סמסונג, מנהל SIM עם בחירת הכרטיס לנתונים ניידים",
    caption: "בטלפון שלכם התפריט עשוי להיראות מעט אחרת.",
  },
  // Samsung Connections > Mobile networks > Data roaming:
  // https://www.samsung.com/uk/support/mobile-devices/how-do-i-turn-international-data-roaming-on-or-off-on-my-samsung-galaxy-device/
  samsungRoaming: {
    src: "/esim/samsung-data-roaming.webp",
    w: 248,
    h: 530,
    alt: "סמסונג, רשתות סלולריות עם המתג Data roaming",
    caption: "המתג Data roaming צריך להיות דלוק. בתמונה הוא כבוי.",
  },
} satisfies Record<string, Shot>;

function CompatBody() {
  return (
    <div className="stack">
      <p>
        מחייגים <bdi dir="ltr"><strong>*#06#</strong></bdi> בטלפון, כמו מספר רגיל. האם מופיעה שורה בשם{" "}
        <strong>EID</strong>?
      </p>
      <ul className="esim-checks">
        <li>
          <CircleCheck size={20} aria-hidden />
          <span>בדרך כלל: אייפון XS ומעלה, סמסונג Galaxy S20 ומעלה.</span>
        </li>
        <li>
          <CircleCheck size={20} aria-hidden />
          <span>
            הטלפון צריך להיות „פתוח” ולא נעול לחברה סלולרית. טלפון שנקנה בחנות רגילה בארץ בדרך כלל פתוח.
          </span>
        </li>
      </ul>
    </div>
  );
}

function CouponBody() {
  return (
    <div className="stack">
      <p>במסך התשלום לוחצים על שדה הקוד (<bdi className="latin">Promo / Referral code</bdi>), מדביקים את הקוד ומשלמים.</p>
      <CouponCode
        code="NEWTOAIRALO15"
        title="15% הנחה לנרשמים חדשים"
        note="דווח כעובד באתרי קופונים בסוף אוקטובר 2026"
      />
      <div className="card card-pad stack">
        <strong>3$ הנחה עם קוד הזמנה מחבר</strong>
        <p className="small muted">
          מי שכבר יש לו חשבון Airalo (למשל הילדים) מוצא באפליקציה את „<bdi className="latin">Refer & earn</bdi>” ושולח לכם קוד אישי. אתם
          מקבלים 3$ הנחה, והוא מקבל 3$ לקנייה הבאה. זה המבצע הרשמי של Airalo.
        </p>
      </div>
      <p className="small muted">אי אפשר לשלב שני קודים. מנסים את הראשון, ואם לא עובד את השני.</p>
    </div>
  );
}

function stepsFor(phone: Phone): Step[] {
  const iphone = phone === "iphone";
  const store = iphone ? "App Store" : "Google Play";

  const shared: Step[] = [
    {
      id: "compat",
      phase: "before",
      title: "בודקים שהטלפון מתאים",
      kind: "compat",
      body: <CompatBody />,
    },
    {
      id: "app",
      phase: "before",
      title: "מורידים את Airalo",
      body: (
        <p>
          בבית, על Wi‑Fi, יום־יומיים לפני הטיסה: מורידים את האפליקציה <strong>Airalo</strong> מה־{store} ונרשמים
          עם אימייל.
        </p>
      ),
      action: (
        <a
          className="btn btn-outline btn-block"
          href={iphone ? STORE_URL.ios(AIRALO_APP.ios) : STORE_URL.android(AIRALO_APP.android)}
          target="_blank"
          rel="noreferrer"
        >
          <Download size={18} aria-hidden /> פתיחת Airalo ב־{store}
        </a>
      ),
    },
    {
      id: "plan",
      phase: "before",
      title: "בוחרים חבילה",
      body: (
        <p>
          מחפשים <strong>Hungary</strong> ובוחרים חבילה: <strong><bdi className="latin">3GB</bdi> ל־7 ימים</strong>.
        </p>
      ),
      shot: SHOTS.airaloPackages,
    },
    {
      id: "coupon",
      phase: "before",
      title: "קוד הנחה ותשלום",
      kind: "coupon",
      body: <CouponBody />,
    },
  ];

  if (iphone) {
    return [
      ...shared,
      {
        id: "install",
        phase: "before",
        title: "מתקינים את ה־eSIM",
        body: (
          <p>
            באפליקציה לוחצים:
            <br />
            <P en>My eSIMs → Install or share</P>
            <br />
            <P en>Install eSIM → Direct installation</P>
            <br />
            וממשיכים לפי ההוראות של האייפון.
          </p>
        ),
        shot: SHOTS.airaloInstall,
        more: {
          summary: "ההתקנה הישירה לא עובדת?",
          body: (
            <p>
              <P>הגדרות ← סלולר ← הוסף eSIM</P> ואז <P en>Use QR Code</P>. סורקים את קוד ה־QR שמופיע באפליקציה, ממסך
              של טלפון או מחשב אחר.
            </p>
          ),
          shots: [SHOTS.iphoneQr],
        },
      },
      {
        id: "label",
        phase: "before",
        title: "נותנים שם לקו",
        body: (
          <p>
            כשהאייפון שואל איך לקרוא לקו, בוחרים <strong>Custom</strong> וכותבים <strong>Airalo</strong>. בכל
            שאלה אחרת בוחרים בקו הישראלי (ראשי).
          </p>
        ),
        shot: SHOTS.iphoneLabel,
      },
      {
        id: "off",
        phase: "before",
        title: "מכבים את הקו עד הנחיתה",
        body: (
          <p>
            <P>הגדרות ← סלולר ← Airalo</P> ומכבים את <P>הפעל קו זה</P>. כך החבילה לא מתחילה לרוץ לפני הזמן.
          </p>
        ),
      },
      {
        id: "on",
        phase: "landing",
        title: "נחתנו: מדליקים את הקו",
        body: (
          <p>
            <P>הגדרות ← סלולר ← Airalo</P> מדליקים <P>הפעל קו זה</P> ומדליקים <P>נדידת נתונים</P>. בלי זה אין
            אינטרנט!
          </p>
        ),
        shot: SHOTS.iphoneCellular,
      },
      {
        id: "data",
        phase: "landing",
        title: "בוחרים ב־Airalo לגלישה",
        body: (
          <p>
            <P>הגדרות ← סלולר ← נתונים סלולריים</P> בוחרים <strong>Airalo</strong>, ומכבים את{" "}
            <P>התר החלפת נתונים סלולריים</P>.
          </p>
        ),
        shot: SHOTS.iphoneData,
      },
      {
        id: "il",
        phase: "landing",
        title: "מכבים נדידה בקו הישראלי",
        body: (
          <p>
            <P>הגדרות ← סלולר ← הקו הישראלי</P> מוודאים ש<P>נדידת נתונים</P> <strong>כבויה</strong>. כך החברה
            בארץ לא תחייב על גלישה.
          </p>
        ),
      },
      {
        id: "done",
        phase: "landing",
        title: "זהו, יש אינטרנט",
        kind: "done",
        body: (
          <p>
            וואטסאפ ממשיך לעבוד על אותו מספר, ושיחות רגילות ו־SMS נשארים על הקו הישראלי. אם עדיין אין אינטרנט,
            פותחים למטה „אם משהו לא עובד”.
          </p>
        ),
      },
    ];
  }

  return [
    ...shared,
    {
      id: "install",
      phase: "before",
      title: "מתקינים את ה־eSIM",
      body: (
        <p>
          באפליקציה לוחצים:
          <br />
          <P en>My eSIMs → Install or share</P>
          <br />
          <P en>Install eSIM → Direct installation</P>
          <br />
          ומאשרים.
        </p>
      ),
      shot: SHOTS.airaloInstall,
      more: {
        summary: "זה לא עובד?",
        body: (
          <p>
            <P>הגדרות ← חיבורים ← מנהל SIM ← הוסף eSIM</P> ואז <P>סרוק קוד QR</P>. סורקים את הקוד שמופיע
            באפליקציה, ממסך של טלפון או מחשב אחר.
          </p>
        ),
        shots: [SHOTS.samsungAdd, SHOTS.samsungQr],
      },
    },
    {
      id: "off",
      phase: "before",
      title: "מכבים את הקו עד הנחיתה",
      body: (
        <p>
          <P>הגדרות ← חיבורים ← מנהל SIM</P> ומכבים את Airalo.
        </p>
      ),
      shot: SHOTS.samsungConnections,
    },
    {
      id: "on",
      phase: "landing",
      title: "נחתנו: בוחרים ב־Airalo",
      body: (
        <p>
          <P>הגדרות ← חיבורים ← מנהל SIM</P> מדליקים את Airalo, וב<P>נתונים ניידים</P> בוחרים{" "}
          <strong>Airalo</strong>.
        </p>
      ),
      shot: SHOTS.samsungData,
    },
    {
      id: "roaming",
      phase: "landing",
      title: "מדליקים נדידת נתונים",
      body: (
        <p>
          <P>הגדרות ← חיבורים ← רשתות סלולריות</P> מדליקים <P>נדידת נתונים</P>. בלי זה אין אינטרנט!
        </p>
      ),
      shot: SHOTS.samsungRoaming,
    },
    {
      id: "done",
      phase: "landing",
      title: "זהו, יש אינטרנט",
      kind: "done",
      body: (
        <p>
          שיחות ו־SMS נשארים על הקו הישראלי. כיוון שהגלישה עוברת ב־Airalo, החברה בארץ לא מחייבת על גלישה.
          וואטסאפ ממשיך לעבוד על אותו מספר. אם עדיין אין אינטרנט, פותחים למטה „אם משהו לא עובד”.
        </p>
      ),
    },
  ];
}

const STEPS: Record<Phone, Step[]> = { iphone: stepsFor("iphone"), android: stepsFor("android") };

/* ---------- Pieces ---------- */

function Screenshot({ shot, eager }: { shot: Shot; eager?: boolean }) {
  return (
    <figure className="esim-shot" data-shape={shot.h > shot.w ? "tall" : "wide"}>
      <Image
        src={shot.src}
        width={shot.w}
        height={shot.h}
        alt={shot.alt}
        unoptimized
        loading={eager ? "eager" : "lazy"}
        sizes="(max-width: 640px) 80vw, 320px"
      />
      {shot.caption ? <figcaption className="small muted">{shot.caption}</figcaption> : null}
    </figure>
  );
}

function NoCompat() {
  return (
    <div className="card card-pad stack esim-alert" role="status">
      <strong>הטלפון הזה כנראה לא תומך ב־eSIM, אז Airalo לא תעבוד עליו.</strong>
      <ul className="bullets esim-bullets">
        <li>אם יש לכם טלפון אחר, בודקים בו (אותו חיוג).</li>
        <li>אם הטלפון חדש, כנראה שהוא נעול לחברה סלולרית. מתקשרים אליה ומבקשים לפתוח אותו.</li>
        <li>אחרת: כרטיס סים הונגרי רגיל מבודפשט, או חבילת חו״ל מהחברה הסלולרית בארץ (יקרה יותר).</li>
      </ul>
    </div>
  );
}

function PhonePick() {
  return (
    <div className="stack esim-step" key="pick">
      <h2 className="esim-title">איזה טלפון יש לכם?</h2>
      <p className="muted">כל אחד בוחר לפי הטלפון שלו. ההתקדמות נשמרת בטלפון הזה, אפשר לחזור באמצע.</p>
      <button type="button" className="card esim-choice" onClick={() => write({ phone: "iphone", step: 0, compat: null })}>
        <span className="esim-choice-icon">
          <Smartphone size={26} aria-hidden />
        </span>
        <span className="grow">
          <strong>אייפון</strong>
          <span className="small muted latin" style={{ display: "block" }}>iPhone</span>
        </span>
      </button>
      <button type="button" className="card esim-choice" onClick={() => write({ phone: "android", step: 0, compat: null })}>
        <span className="esim-choice-icon">
          <Smartphone size={26} aria-hidden />
        </span>
        <span className="grow">
          <strong>סמסונג / אנדרואיד</strong>
          <span className="small muted latin" style={{ display: "block" }}>Samsung Galaxy</span>
        </span>
      </button>
    </div>
  );
}

export function EsimWalkthrough() {
  const saved = useSyncExternalStore(subscribe, read, () => EMPTY);
  const { phone, compat } = saved;
  const steps = phone ? STEPS[phone] : null;
  const last = steps ? steps.length - 1 : 0;
  const index = Math.min(saved.step, last);
  const step = steps ? steps[index] : null;

  // Bring the new step to the top of the screen, but not on first load.
  const topRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [phone, index]);

  // Warm the next screenshot so the step swap never shows an empty frame.
  const nextSrc = steps?.[index + 1]?.shot?.src;
  useEffect(() => {
    if (!nextSrc) return;
    const img = new window.Image();
    img.src = nextSrc;
  }, [nextSrc]);

  if (!phone || !steps || !step) {
    return (
      <div ref={topRef} className="esim-walk">
        <PhonePick />
      </div>
    );
  }

  const canNext = step.kind !== "compat" || compat === "yes";
  const atEnd = index === last;
  const phoneName = phone === "iphone" ? "אייפון" : "סמסונג / אנדרואיד";

  return (
    <div ref={topRef} className="esim-walk">
      <div className="esim-top">
        <span className="esim-count" aria-live="polite">
          שלב {index + 1} מתוך {steps.length}
        </span>
        <button
          type="button"
          className="text-link"
          onClick={() => write({ phone: null, step: 0, compat: null })}
        >
          {phoneName} · החלפה
        </button>
      </div>
      <div
        className="esim-bar"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        aria-label="התקדמות בהתקנה"
      >
        <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="card card-pad stack esim-card esim-step" key={`${phone}-${step.id}`}>
        <span className="tag" style={{ justifySelf: "start" }}>
          {step.phase === "before" ? "בארץ, לפני הטיסה" : "אחרי הנחיתה בבודפשט"}
        </span>
        <h2 className="esim-title">{step.title}</h2>
        <div className="esim-text">{step.body}</div>
        {step.action}

        {step.kind === "compat" ? (
          <>
            <div className="segmented" role="group" aria-label="האם מופיע EID?">
              <button type="button" aria-pressed={compat === "yes"} onClick={() => write({ compat: "yes" })}>
                <CircleCheck size={20} aria-hidden /> כן, יש EID
              </button>
              <button type="button" aria-pressed={compat === "no"} onClick={() => write({ compat: "no" })}>
                <CircleX size={20} aria-hidden /> לא
              </button>
            </div>
            {compat === "no" ? <NoCompat /> : null}
          </>
        ) : null}

        {step.shot ? <Screenshot shot={step.shot} eager /> : null}

        {step.more ? (
          <details className="esim-more">
            <summary>{step.more.summary}</summary>
            <div className="stack">
              <div className="esim-text">{step.more.body}</div>
              {step.more.shots?.map((s) => <Screenshot key={s.src} shot={s} />)}
            </div>
          </details>
        ) : null}
      </div>

      <div className="esim-nav">
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => write(index === 0 ? { phone: null, step: 0, compat: null } : { step: index - 1 })}
        >
          {/* The app is RTL, so "back" points right and "next" points left. */}
          <ArrowRight size={20} aria-hidden /> הקודם
        </button>
        {atEnd ? (
          <button type="button" className="btn btn-primary" onClick={() => write({ step: 0 })}>
            <RotateCcw size={20} aria-hidden /> חזרה להתחלה
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={!canNext} onClick={() => write({ step: index + 1 })}>
            הבא <ArrowLeft size={20} aria-hidden />
          </button>
        )}
      </div>
      {step.kind === "compat" && compat !== "yes" ? (
        <p className="small muted esim-hint">כדי להמשיך, בודקים ולוחצים „כן, יש EID”.</p>
      ) : null}
    </div>
  );
}
