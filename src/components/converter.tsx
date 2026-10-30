"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpDown,
  Banknote,
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
import { Topic } from "./topic";
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

/** Payment tips, folded one per row under the price list. */
const TIPS: { title: string; hint: string; Icon: LucideIcon; body: ReactNode }[] = [
  {
    title: "תשלום בכרטיס",
    hint: "באיזה מטבע לבחור",
    Icon: CreditCard,
    body: (
      <p>
        כשהמכשיר או המלצר שואלים באיזה מטבע לחייב, תמיד לבחור <strong>פורינט (HUF)</strong>. בחירה בשקלים
        נשמעת נוחה, אבל השער שלהם גרוע ומשלמים 5%–10% יותר. ב־Bolt ובשווקים משלמים בכרטיס בלי בעיה.
      </p>
    ),
  },
  {
    title: "טיפ במסעדה",
    hint: "דמי שירות וכמה להשאיר",
    Icon: UtensilsCrossed,
    body: (
      <p>
        הרבה מסעדות כבר מוסיפות לחשבון דמי שירות (szervizdíj) של 10%–13%. אם זה כתוב בחשבון, לא צריך להוסיף
        טיפ. אם לא, נהוג להשאיר כ־10%.
      </p>
    ),
  },
  {
    title: "מזומן",
    hint: "איפה מוציאים כסף",
    Icon: Banknote,
    body: (
      <p>
        לא מחליפים כסף בדוכנים ברחוב או בשדה. אם צריך מזומן, מוציאים מכספומט של בנק (OTP, K&amp;H) ולא מכספומט
        כתום של Euronet.
      </p>
    ),
  },
];

const QUICK: Record<Currency, number[]> = {
  HUF: [1000, 2000, 5000, 10000, 20000, 50000],
  ILS: [10, 20, 50, 100, 200, 500],
};

const LABEL: Record<Currency, string> = { HUF: "פורינט", ILS: "שקלים" };
const SYMBOL: Record<Currency, string> = { HUF: "Ft", ILS: "₪" };

function format(n: number, currency: Currency): string {
  const digits = currency === "ILS" ? (n < 100 ? 1 : 0) : 0;
  const rounded = currency === "HUF" && n >= 1000 ? Math.round(n / 10) * 10 : n;
  return rounded.toLocaleString("he-IL", { maximumFractionDigits: digits });
}

/** What the input shows: thousands commas, and a trailing "." the person just typed. */
function display(raw: string): string {
  const [int, ...rest] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return rest.length ? `${grouped}.${rest.join("").slice(0, 2)}` : grouped;
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
  const value = Number(amount) || 0;
  const result = from === "HUF" ? value * rate.value : value / rate.value;

  function swap() {
    setFrom(to);
    setAmount(result ? String(Math.round(result * (to === "ILS" ? 10 : 1)) / (to === "ILS" ? 10 : 1)) : "");
  }

  return (
    <div className="converter">
      <label className="money-box" htmlFor="money-amount">
        <span className="money-label">
          <span>כמה {LABEL[from]}?</span>
          <span className="currency-flag">{SYMBOL[from]}</span>
        </span>
        <input
          id="money-amount"
          className="money-input"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          value={display(amount)}
          onChange={(e) => {
            // Digits and one decimal point only; commas are added for display.
            const clean = e.target.value.replace(/[^\d.]/g, "");
            const [int, ...rest] = clean.split(".");
            setAmount(rest.length ? `${int}.${rest.join("")}` : int);
          }}
          onFocus={(e) => e.target.select()}
        />
      </label>

      <button type="button" className="swap" onClick={swap}>
        <ArrowUpDown size={20} aria-hidden />
        {from === "HUF" ? "להפוך: מקלידים שקלים" : "להפוך: מקלידים פורינט"}
      </button>

      <div className="money-box is-result" aria-live="polite">
        <span className="money-label">
          <span>שווה בערך, ב{LABEL[to]}</span>
          <span className="currency-flag">{SYMBOL[to]}</span>
        </span>
        <div className="money-result">
          {to === "ILS" ? "₪" : ""}
          {format(result, to)}
          {to === "HUF" ? " Ft" : ""}
        </div>
      </div>

      <div className="quick-label" id="quick-label">
        או לוחצים על סכום:
      </div>
      <div className="quick-amounts" role="group" aria-labelledby="quick-label">
        {QUICK[from].map((q) => (
          <button key={q} type="button" aria-pressed={Number(amount) === q} onClick={() => setAmount(String(q))}>
            {q.toLocaleString("en-US")}
          </button>
        ))}
      </div>

      <div className="rate-note">
        <p>
          <bdi>1,000</bdi> פורינט שווים בערך <bdi>₪{(rate.value * 1000).toFixed(2)}</bdi>
        </p>
        <p>
          שקל אחד שווה בערך <bdi>{Math.round(1 / rate.value)}</bdi> פורינט
        </p>
        <p className="rate-status">
          {status === "loading" && "בודק שער עדכני…"}
          {status === "live" && <>שער עדכני מ־<bdi>{formatDate(rate.date)}</bdi></>}
          {status === "offline" && <>אין חיבור לאינטרנט. משתמשים בשער האחרון שנשמר, מ־<bdi>{formatDate(rate.date)}</bdi></>}
        </p>
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
                <span className="price-huf">
                  כ־<bdi>{huf.toLocaleString("en-US")}</bdi> פורינט
                </span>
              </span>
              <strong className="price-ils">
                <bdi>₪{Math.round(huf * rate.value)}</bdi>
              </strong>
            </div>
          ))}
        </div>
      </div>

      <h2 className="section-title">
        <span className="badge-icon">
          <CreditCard size={20} aria-hidden />
        </span>
        טיפים לתשלום
      </h2>
      <div className="card topic-list">
        {TIPS.map(({ title, hint, Icon, body }) => (
          <Topic key={title} icon={<Icon size={22} aria-hidden />} title={title} hint={hint}>
            {body}
          </Topic>
        ))}
      </div>
    </div>
  );
}
