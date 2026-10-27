"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "./ui";

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
      <button type="button" className="btn btn-navy btn-sm" onClick={copy} style={{ flex: "none" }}>
        {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "הועתק" : "העתקה"}
      </button>
    </div>
  );
}

type Step = React.ReactNode;

const P = ({ children }: { children: React.ReactNode }) => <span className="path">{children}</span>;

const STEPS: Record<"iphone" | "android", { before: Step[]; landing: Step[] }> = {
  iphone: {
    before: [
      <>בבית, על Wi‑Fi, יום־יומיים לפני הטיסה: מורידים את האפליקציה <strong>Airalo</strong> מה־App Store ונרשמים עם אימייל.</>,
      <>מחפשים <strong>Hungary</strong> ובוחרים חבילה: <strong>3GB · 7 ימים</strong>.</>,
      <>במסך התשלום לוחצים על שדה הקוד (Promo / Referral code), מדביקים את הקוד מלמעלה ומשלמים.</>,
      <>לוחצים <P>Install eSIM</P> ואז <P>Direct installation</P>, וממשיכים לפי ההוראות של האייפון.</>,
      <>כשהאייפון שואל איך לקרוא לקווים: לקו החדש קוראים <strong>Airalo</strong>. בכל השאלות האחרות בוחרים בקו הישראלי (ראשי).</>,
      <>מכבים את הקו עד הנחיתה: <P>הגדרות ← סלולר ← Airalo</P> ומכבים את <P>הפעל קו זה</P>. כך החבילה לא מתחילה לרוץ לפני הזמן.</>,
    ],
    landing: [
      <><P>הגדרות ← סלולר ← Airalo</P>: מדליקים <P>הפעל קו זה</P> ומדליקים <P>נדידת נתונים</P>. בלי זה אין אינטרנט!</>,
      <><P>הגדרות ← סלולר ← נתונים סלולריים</P>: בוחרים <strong>Airalo</strong>, ומכבים את <P>התר החלפת נתונים סלולריים</P>.</>,
      <><P>הגדרות ← סלולר ←</P> הקו הישראלי: מוודאים ש<P>נדידת נתונים</P> <strong>כבויה</strong>. כך החברה בארץ לא תחייב על גלישה.</>,
      <>זהו. וואטסאפ ממשיך לעבוד על אותו מספר, ושיחות רגילות ו־SMS נשארים על הקו הישראלי.</>,
    ],
  },
  android: {
    before: [
      <>בבית, על Wi‑Fi, יום־יומיים לפני הטיסה: מורידים את האפליקציה <strong>Airalo</strong> מ־Google Play ונרשמים עם אימייל.</>,
      <>מחפשים <strong>Hungary</strong> ובוחרים חבילה: <strong>3GB · 7 ימים</strong>.</>,
      <>במסך התשלום לוחצים על שדה הקוד (Promo / Referral code), מדביקים את הקוד מלמעלה ומשלמים.</>,
      <>לוחצים <P>Install eSIM</P> ואז <P>Direct installation</P>, ומאשרים. אם זה לא עובד: <P>הגדרות ← חיבורים ← מנהל SIM ← הוסף eSIM</P> וסורקים את קוד ה־QR מהאפליקציה.</>,
      <>מכבים את הקו עד הנחיתה: <P>הגדרות ← חיבורים ← מנהל SIM</P> ומכבים את Airalo.</>,
    ],
    landing: [
      <><P>הגדרות ← חיבורים ← מנהל SIM</P>: מדליקים את Airalo, וב<P>נתונים ניידים</P> בוחרים <strong>Airalo</strong>.</>,
      <><P>הגדרות ← חיבורים ← רשתות סלולריות</P>: מדליקים <P>נדידת נתונים</P>. בלי זה אין אינטרנט!</>,
      <>שיחות ו־SMS נשארים על הקו הישראלי. כיוון שהגלישה עוברת ב־Airalo, החברה בארץ לא מחייבת על גלישה.</>,
      <>זהו. וואטסאפ ממשיך לעבוד על אותו מספר.</>,
    ],
  },
};

export function InstallSteps() {
  const [phone, setPhone] = useState<"iphone" | "android">("iphone");
  const steps = STEPS[phone];
  return (
    <>
      <div className="segmented" role="group" aria-label="סוג הטלפון" style={{ marginBlockEnd: 12 }}>
        <button type="button" aria-pressed={phone === "iphone"} onClick={() => setPhone("iphone")}>
          אייפון
        </button>
        <button type="button" aria-pressed={phone === "android"} onClick={() => setPhone("android")}>
          סמסונג / אנדרואיד
        </button>
      </div>
      <div className="card card-pad stack">
        <strong style={{ fontSize: "1.05rem" }}>בארץ, לפני הטיסה</strong>
        <ol className="steps">
          {steps.before.map((s, i) => (
            <li key={i}>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="card card-pad stack" style={{ marginBlockStart: 12 }}>
        <strong style={{ fontSize: "1.05rem" }}>אחרי הנחיתה בבודפשט</strong>
        <ol className="steps" style={{ "--step": "#1f6a3f" } as React.CSSProperties}>
          {steps.landing.map((s, i) => (
            <li key={i}>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
