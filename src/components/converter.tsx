"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpDown,
  CarTaxiFront,
  Coffee,
  CreditCard,
  Croissant,
  Pizza,
  Plane,
  Soup,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { updateSettings, useSettings } from "@/lib/store";

/** Shekels per forint, July 2026 — used until a live rate arrives. */
const FALLBACK = { value: 0.0096, date: "2026-07-24" };

type Currency = "HUF" | "ILS";

/** Typical prices, in forints. Goulash: Mama Goulash's menu price (Hungary Unlocked, 2026). */
const PRICES: { label: string; huf: number; Icon: LucideIcon }[] = [
  { label: "קפה", huf: 1200, Icon: Coffee },
  { label: "קירטוש בשוק", huf: 2500, Icon: Croissant },
  { label: "גולאש במסעדה עממית", huf: 2900, Icon: Soup },
  { label: "לאנגוש", huf: 3000, Icon: Pizza },
  { label: "ארוחה במסעדה לאדם", huf: 9000, Icon: UtensilsCrossed },
  { label: "מונית קצרה בעיר", huf: 3000, Icon: CarTaxiFront },
  { label: "מונית לשדה", huf: 13000, Icon: Plane },
];

const QUICK: Record<Currency, number[]> = {
  HUF: [1000, 2000, 5000, 10000, 20000, 50000],
  ILS: [10, 20, 50, 100, 200, 500],
};

const LABEL: Record<Currency, string> = { HUF: "פורינט", ILS: "שקל" };
const SYMBOL: Record<Currency, string> = { HUF: "Ft", ILS: "₪" };
const CODE: Record<Currency, string> = { HUF: "HUF", ILS: "ILS" };

function format(n: number, currency: Currency): string {
  const digits = currency === "ILS" ? (n < 100 ? 1 : 0) : 0;
  const rounded = currency === "HUF" && n >= 1000 ? Math.round(n / 10) * 10 : n;
  return rounded.toLocaleString("he-IL", { maximumFractionDigits: digits });
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function Converter() {
  const { rate: saved } = useSettings();
  const rate = saved ?? FALLBACK;
  const [from, setFrom] = useState<Currency>("HUF");
  const [amount, setAmount] = useState("10000");
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rate")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { rate: number; date: string }) => {
        if (cancelled) return;
        updateSettings({ rate: { value: data.rate, date: data.date } });
        setStatus("live");
      })
      .catch(() => !cancelled && setStatus("offline"));
    return () => {
      cancelled = true;
    };
  }, []);

  const to: Currency = from === "HUF" ? "ILS" : "HUF";
  const value = Number(amount.replace(/[^\d.]/g, "")) || 0;
  const result = from === "HUF" ? value * rate.value : value / rate.value;

  function swap() {
    setFrom(to);
    setAmount(result ? String(Math.round(result * (to === "ILS" ? 10 : 1)) / (to === "ILS" ? 10 : 1)) : "");
  }

  return (
    <div className="converter">
      <label className="money-box">
        <span className="money-label">
          <span>מחיר ב{LABEL[from]}</span>
          <span className="currency-flag">{CODE[from]}</span>
        </span>
        <input
          className="money-input"
          inputMode="decimal"
          value={value ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : amount}
          onChange={(e) => setAmount(e.target.value.replace(/,/g, ""))}
          onFocus={(e) => e.target.select()}
          aria-label={`סכום ב${LABEL[from]}`}
        />
      </label>

      <button type="button" className={`icon-btn swap${from === "ILS" ? " is-flipped" : ""}`} onClick={swap} aria-label="החלפת כיוון">
        <ArrowUpDown size={22} />
      </button>

      <div className="money-box is-result" aria-live="polite">
        <span className="money-label">
          <span>שווה ב{LABEL[to]}</span>
          <span className="currency-flag">{CODE[to]}</span>
        </span>
        <div className="money-result">
          {SYMBOL[to] === "₪" ? "₪" : ""}
          {format(result, to)}
          {SYMBOL[to] === "Ft" ? " Ft" : ""}
        </div>
      </div>

      <div className="quick-amounts" role="group" aria-label="סכומים מהירים">
        {QUICK[from].map((q) => (
          <button key={q} type="button" onClick={() => setAmount(String(q))}>
            {q.toLocaleString("en-US")}
          </button>
        ))}
      </div>

      <p className="rate-note">
        1,000 פורינט ≈ ₪{(rate.value * 1000).toFixed(2)} · ₪1 ≈ {Math.round(1 / rate.value)} פורינט
        <br />
        {status === "loading" && "בודק שער עדכני…"}
        {status === "live" && `שער עדכני מ־${formatDate(rate.date)}`}
        {status === "offline" && `אין חיבור. שער אחרון שנשמר: ${formatDate(rate.date)}`}
      </p>

      <h2 className="section-title">
        <span className="badge-icon">
          <CreditCard size={20} aria-hidden />
        </span>
        טיפ לתשלום בכרטיס
      </h2>
      <div className="note-box">
        כשהמכשיר או המלצר שואלים באיזה מטבע לחייב, תמיד לבחור <strong>פורינט (HUF)</strong>. בחירה
        בשקלים נשמעת נוחה, אבל השער שלהם גרוע ומשלמים 5%–10% יותר. ב־Bolt ובשווקים משלמים בכרטיס בלי בעיה.
      </div>
      <div className="note-box" style={{ marginBlockStart: 10 }}>
        <strong>טיפ במסעדה:</strong> הרבה מסעדות כבר מוסיפות לחשבון דמי שירות (szervizdíj) של 10%–13%. אם זה
        כתוב בחשבון, לא צריך להוסיף טיפ. אם לא, נהוג להשאיר כ־10%.
      </div>
      <div className="note-box" style={{ marginBlockStart: 10 }}>
        <strong>מזומן:</strong> לא מחליפים כסף בדוכנים ברחוב או בשדה. אם צריך מזומן, מוציאים מכספומט של בנק (OTP,
        K&amp;H) ולא מכספומט כתום של Euronet.
      </div>

      <h2 className="section-title">מחירים נפוצים בשקלים</h2>
      <div className="card">
        <div className="list">
          {PRICES.map(({ label, huf, Icon }) => (
            <div key={label} className="price-row">
              <span className="price-icon">
                <Icon size={20} aria-hidden />
              </span>
              <span className="grow">
                {label}
                <br />
                <span className="muted small">כ־{huf.toLocaleString("en-US")} פורינט</span>
              </span>
              <strong>₪{Math.round(huf * rate.value)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
