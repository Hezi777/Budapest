import Link from "next/link";
import {
  BedDouble,
  CalendarCheck,
  CarTaxiFront,
  ChevronLeft,
  Coins,
  MessageCircle,
  Navigation,
  Phone,
  Settings,
  Siren,
  Snowflake,
  Sunset,
  TreePine,
  UtensilsCrossed,
  Wifi,
  Wine,
} from "lucide-react";
import { HashOpen } from "@/components/hash-open";
import { InstallCard } from "@/components/install-card";
import { SettingsPanel } from "@/components/settings-panel";
import { StoreLinks, type StoreIds } from "@/components/ui";
import { EMERGENCY_GROUPS, telHref } from "@/lib/emergency";
import { PLAN_PLACES, HOTEL_ID } from "@/lib/places";
import { directionsUrl } from "@/lib/geo";

const HOTEL = PLAN_PLACES.find((p) => p.id === HOTEL_ID)!;

// Bolt: Request a Ride — https://apps.apple.com/app/id675033630,
// https://play.google.com/store/apps/details?id=ee.mtakso.client
const BOLT_APP: StoreIds = { app: "Bolt", ios: "675033630", android: "ee.mtakso.client" };

const BOOKINGS = [
  { when: "חמישי 18:00", what: "שייט בדנובה · Legenda", how: "legenda.hu", href: "https://www.legenda.hu" },
  {
    when: "חמישי 19:30",
    what: "Carmel",
    how: "reservours.com/en/carmelrestaurant",
    href: "https://reservours.com/en/carmelrestaurant",
  },
  { when: "שישי 20:00", what: "Alelí", how: "aleli.hu · ‎+36 30 494 1144", href: "https://aleli.hu" },
  {
    when: "שישי ערב",
    what: "ארוחת שבת כשרה · חנה",
    how: "‎+36 1 342 1072 · משלמים מראש עד שישי 14:00",
    href: "tel:+3613421072",
  },
  {
    when: "שבת 19:15",
    what: "Hot Stone Steakhouse",
    how: "בטלפון או דרך Google Maps",
    href: "https://www.google.com/maps/search/?api=1&query=Hot+Stone+Steakhouse+Budapest",
  },
];


/**
 * One topic of the hub: a big row (icon, title, one-line hint) that folds open
 * in place. The id doubles as an anchor, e.g. /info#transport.
 */
function Topic({
  id,
  icon,
  title,
  hint,
  flush,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  /** No padding in the body, for lists that bring their own. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="topic" id={id}>
      <summary className="topic-head">
        <span className="topic-icon">{icon}</span>
        <span className="grow">
          <span className="topic-title">{title}</span>
          <span className="topic-hint">{hint}</span>
        </span>
      </summary>
      <div className={`topic-body${flush ? " is-flush" : ""}`}>{children}</div>
    </details>
  );
}

export default function InfoPage() {
  return (
    <>
      <HashOpen />
      <div className="page-head">
        <h1 className="page-title">מידע שימושי</h1>
        <p className="page-lead">טלפונים לחירום, המלון, מוניות, כשרות וכל השאר.</p>
      </div>

      <h2 className="section-title info-sos-title" id="sos" style={{ scrollMarginTop: 70 }}>
        <span className="badge-icon is-sos">
          <Siren size={20} aria-hidden />
        </span>
        טלפונים לחירום
      </h2>
      <a className="sos-call" href="tel:112">
        <span className="num">112</span>
        <span style={{ flex: 1 }}>
          <strong>מוקד חירום אירופי</strong>
          <br />
          <span className="small">משטרה, אמבולנס וכבאים. עונים באנגלית.</span>
        </span>
        <Phone size={26} aria-hidden />
      </a>
      <div className="stack" style={{ marginBlockStart: 12 }}>
        {EMERGENCY_GROUPS.map((group, i) => (
          // Only the Israeli MFA group starts open; 112 above covers Hungary.
          <details key={group.title} className="card group" open={i === 1}>
            <summary className="group-title">{group.title}</summary>
            <div className="list">
              {group.contacts.map((c) => (
                <a
                  key={c.name}
                  className="list-row"
                  href={telHref(c)}
                  target={c.whatsapp ? "_blank" : undefined}
                  rel={c.whatsapp ? "noreferrer" : undefined}
                >
                  <span className="grow">
                    <span className="title">{c.name}</span>
                    <br />
                    <span className="sub latin" style={{ display: "inline-block" }}>{c.phone}</span>
                    {c.note && <span className="sub"> · {c.note}</span>}
                  </span>
                  <span className="lead">
                    {c.whatsapp ? <MessageCircle size={20} aria-label="וואטסאפ" /> : <Phone size={20} aria-label="חיוג" />}
                  </span>
                </a>
              ))}
            </div>
          </details>
        ))}
      </div>
      <p className="small muted" style={{ marginBlockStart: 10 }}>
        מספרי הביטוח והאשראי נבדקו באוקטובר 2026. כדאי לוודא מול הפוליסה ומול גב הכרטיס, ולצלם את שניהם לפני
        הטיסה. מד״א (101) ומשטרת ישראל (100) לא עובדים מחו״ל.
      </p>

      <h2 className="info-heading">נושאים</h2>
      <div className="card topic-list">
        <Topic id="hotel" icon={<BedDouble size={22} aria-hidden />} title="המלון" hint="כתובת, ניווט והתקשרות">
          <div className="stack">
            <div>
              <div className="title latin" style={{ textAlign: "start", fontWeight: 800, fontSize: "1.1rem" }}>
                {HOTEL.local}
              </div>
              <div className="muted latin" style={{ textAlign: "start" }}>
                Kossuth Lajos utca 7-9
              </div>
              <div className="muted">ליד תחנת המטרו Astoria (קו M2)</div>
            </div>
            <div className="btn-row">
              <a className="btn btn-primary" href={directionsUrl(HOTEL)} target="_blank" rel="noreferrer">
                <Navigation size={18} /> ניווט למלון
              </a>
              <a className="btn btn-outline" href={`tel:${HOTEL.phone!.replace(/\s/g, "")}`}>
                <Phone size={18} /> התקשרות
              </a>
            </div>
          </div>
        </Topic>

        <Topic
          id="transport"
          icon={<CarTaxiFront size={22} aria-hidden />}
          title="מוניות ותחבורה"
          hint="מוניות, מטרו ומה לעשות בנחיתה"
        >
          <div className="stack">
            <ol className="steps">
              <li>מורידים את Bolt עוד בארץ, ונרשמים עם מספר הטלפון וכרטיס אשראי.</li>
              <li>בכל קטע מונית בתוכנית יש כתובת באנגלית. לוחצים עליה, היא מועתקת, ומדביקים ב־Bolt.</li>
              <li>המחיר מופיע מראש ומחויב אוטומטית. לא צריך מזומן.</li>
              <li>לא עוצרים מוניות ברחוב. בשדה התעופה: עמדת Főtaxi הרשמית או Bolt.</li>
            </ol>
            <StoreLinks {...BOLT_APP} />
          </div>
          <ul className="bullets info-bullets">
            <li>
              <strong>בנחיתה:</strong> בביקורת הדרכונים יש מאז 2026 רישום ביומטרי חדש (EES) לישראלים, והתור יכול
              להתארך. לא לתכנן משהו צמוד לנחיתה.
            </li>
            <li>
              <strong>מטרו ואוטובוס 100E לשדה:</strong> אפשר לשלם בכניסה בהצמדת כרטיס אשראי (כרטיס בודד). המלון ליד
              תחנת Astoria בקו M2.
            </li>
            <li>
              <strong>לא עוצרים מונית ברחוב.</strong> רק Bolt או Főtaxi. מונית רחוב לשדה יכולה לעלות פי 3.
            </li>
          </ul>
        </Topic>

        <div className="topic">
          <Link href="/esim" className="topic-head">
            <span className="topic-icon">
              <Wifi size={22} aria-hidden />
            </span>
            <span className="grow">
              <span className="topic-title">אינטרנט בחו״ל</span>
              <span className="topic-hint">מדריך eSIM עם קוד הנחה</span>
            </span>
            <ChevronLeft size={22} aria-hidden className="topic-go" />
          </Link>
        </div>

        <Topic id="kosher" icon={<UtensilsCrossed size={22} aria-hidden />} title="אוכל כשר ושבת" hint="זמני שבת ומה לאכול">
          <div className="stack">
            <p>
              במסעדות שאינן כשרות: מנות צמחוניות, פסטה, פיצה, או דגים עם קשקשים (סלמון, טונה, דניס). להימנע
              מפירות ים ומגולאש.
            </p>
            <p>
              <strong>שבת (27–28 בנובמבר):</strong> הדלקת נרות בערך 15:35, צאת שבת בערך 16:50 (לוודא ב־chabad.org).
              המסעדות הכשרות נסגרות בשישי בצהריים, ומגישות ארוחות שבת רק בהזמנה ובתשלום מראש.
            </p>
            <p>
              <strong>בית הכנסת הגדול (דוהאני)</strong> סגור בשבת. מתאים לחמישי או לראשון בבוקר.
            </p>
            <Link className="btn btn-outline" href="/explore">
              לכל המקומות הכשרים <ChevronLeft size={18} />
            </Link>
          </div>
        </Topic>

        <Topic
          id="christmas"
          icon={<TreePine size={22} aria-hidden />}
          title="שווקי כריסמס"
          hint="שעות, מה לטעום והחשמלית המוארת"
          flush
        >
          <ul className="bullets">
            <li>
              <strong>שוק ורשמרטי:</strong> בערך 11:00–21:00 (שישי־שבת עד 22:00). משלמים בכרטיס.
            </li>
            <li>
              <strong>שוק הבזיליקה:</strong> 11:00–22:00 (שישי־שבת עד 23:00), עם מופע אורות על החזית מ־17:30, כל
              חצי שעה. נבחר שוב לשוק הכריסמס הטוב באירופה.
            </li>
            <li>
              <strong>לטעום:</strong> קירטוש (עוגת ארובה), לאנגוש עם שמנת וגבינה, ערמונים קלויים.
            </li>
            <li>
              <strong>החשמלית המוארת:</strong> בשנה שעברה התחילה ב־28/11 ונוסעים בכרטיס רגיל. לבדוק באפליקציית
              BudapestGO.
            </li>
          </ul>
        </Topic>

        <Topic id="good-to-know" icon={<Snowflake size={22} aria-hidden />} title="טוב לדעת" hint="קור, שקיעה, פורינט ומשקאות">
          <div className="info-grid">
            <div className="info-tile">
              <Snowflake size={22} aria-hidden />
              <div className="big latin" style={{ textAlign: "start" }}>0–7°</div>
              <p className="small muted">קר. מעיל, כפפות, כובע ונעליים נוחות.</p>
            </div>
            <div className="info-tile">
              <Sunset size={22} aria-hidden />
              <div className="big">15:55</div>
              <p className="small muted">שקיעה. בחמש כבר חושך, והשווקים נדלקים.</p>
            </div>
            <div className="info-tile">
              <Coins size={22} aria-hidden />
              <div className="big">פורינט</div>
              <p className="small muted">1,000 פורינט ≈ 9 ₪. אשראי עובד כמעט בכל מקום.</p>
            </div>
            <div className="info-tile">
              <Wine size={22} aria-hidden />
              <div className="big">בלי אלכוהול</div>
              <p className="small muted">בשווקים: gyerekpuncs או שוקו חם. לאבא: בירה Dreher.</p>
            </div>
          </div>
        </Topic>

        <Topic id="bookings" icon={<CalendarCheck size={22} aria-hidden />} title="הזמנות" hint="מה כדאי להזמין מראש" flush>
          <div className="list">
            {BOOKINGS.map((b) => (
              <a key={b.what} className="list-row" href={b.href} target="_blank" rel="noreferrer">
                <span className="lead" style={{ fontSize: "0.78rem", lineHeight: 1.15, textAlign: "center" } as React.CSSProperties}>
                  {b.when}
                </span>
                <span className="grow">
                  <span className="title">{b.what}</span>
                  <br />
                  <span className="sub">{b.how}</span>
                </span>
                <ChevronLeft size={20} aria-hidden />
              </a>
            ))}
          </div>
        </Topic>

        <Topic id="settings" icon={<Settings size={22} aria-hidden />} title="הגדרות" hint="גודל הטקסט והוספה למסך הבית" flush>
          <SettingsPanel />
          <InstallCard />
        </Topic>
      </div>

      <div className="footer-note">
        <span>שעות, מחירים וטלפונים נבדקו באוקטובר 2026. שווה לבדוק שוב שבוע לפני.</span>
        <span>תמונות: ויקיפדיה ו־Wikimedia Commons. מפה: OpenStreetMap.</span>
      </div>
    </>
  );
}
