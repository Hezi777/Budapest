import {
  CalendarCheck,
  CarTaxiFront,
  ChevronLeft,
  Coins,
  Phone,
  Settings,
  Snowflake,
  Sunset,
  TreePine,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { SettingsPanel } from "@/components/settings-panel";

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
    when: "שישי בערב",
    what: "ארוחת שבת כשרה (אם רוצים) · חנה",
    how: "‎+36 1 342 1072 · משלמים מראש עד שישי 14:00",
    href: "tel:+3613421072",
  },
  {
    when: "שבת 19:15",
    what: "Hot Stone Steakhouse (אם הולכים)",
    how: "בטלפון או דרך Google Maps",
    href: "https://www.google.com/maps/search/?api=1&query=Hot+Stone+Steakhouse+Budapest",
  },
];

export default function TipsPage() {
  return (
    <>
      <h1 className="page-title">שימושי לדעת</h1>
      <p className="page-lead">כל מה שכדאי לדעת לפני ובמהלך הטיול.</p>

      <div className="card tip-card is-bolt">
        <h2 className="section-heading" style={{ margin: 0 }}>
          <CarTaxiFront size={24} aria-hidden style={{ color: "#6b4b00" }} /> מוניות: אפליקציית Bolt
        </h2>
        <ol className="steps">
          <li>
            מורידים את <strong>Bolt</strong> עוד בארץ, ונרשמים עם מספר הטלפון וכרטיס אשראי.
          </li>
          <li>בכל פס צהוב בתוכנית כתובה כתובת היעד באנגלית. לוחצים עליה, היא מועתקת, ומדביקים ב־Bolt.</li>
          <li>המחיר מופיע מראש ומחויב אוטומטית. לא צריך מזומן.</li>
          <li>לא עוצרים מוניות ברחוב. בשדה התעופה: עמדת Főtaxi הרשמית או Bolt.</li>
        </ol>
        <a className="primary-button" href="https://bolt.eu/he-il/" target="_blank" rel="noreferrer" style={{ "--day": "#b3372d" } as React.CSSProperties}>
          להורדת Bolt
        </a>
      </div>

      <div className="tip-grid" style={{ marginBlockStart: 12 }}>
        <div className="card tip-tile">
          <Snowflake size={22} aria-hidden />
          <div className="tip-big latin" style={{ textAlign: "start" }}>0–7°</div>
          <p className="small muted">קר. מעיל, כפפות, כובע ונעליים נוחות.</p>
        </div>
        <div className="card tip-tile">
          <Sunset size={22} aria-hidden />
          <div className="tip-big">15:55</div>
          <p className="small muted">שקיעה. בחמש כבר חושך, והשווקים נדלקים.</p>
        </div>
        <div className="card tip-tile">
          <Coins size={22} aria-hidden />
          <div className="tip-big">פורינט</div>
          <p className="small muted">1,000 פורינט ≈ 10 ₪. אשראי עובד כמעט בכל מקום.</p>
        </div>
        <div className="card tip-tile">
          <Wine size={22} aria-hidden />
          <div className="tip-big">בלי אלכוהול</div>
          <p className="small muted">בשווקים: gyerekpuncs או שוקו חם. לאבא: בירה Dreher או Soproni.</p>
        </div>
      </div>

      <h2 className="section-heading">
        <TreePine size={24} aria-hidden style={{ color: "#9d2323" }} /> כריסמס בבודפשט
      </h2>
      <div className="card" style={{ padding: "4px 20px" }}>
        <ul className="bullet-list">
          <li>
            <strong>שוק ורשמרטי:</strong> בערך 11:00–21:00 (שישי־שבת עד 22:00). משלמים בכרטיס.
          </li>
          <li>
            <strong>שוק הבזיליקה:</strong> בערך 11:00–22:00 (שישי־שבת עד 23:00), עם מופע אורות על החזית
            מ־17:30, כל חצי שעה. נבחר שוב לשוק הכריסמס הטוב באירופה.
          </li>
          <li>
            <strong>לטעום:</strong> קירטוש (עוגת ארובה), לאנגוש עם שמנת וגבינה, ערמונים קלויים.
          </li>
          <li>
            <strong>החשמלית המוארת:</strong> חשמליות מקושטות באלפי נורות. בשנה שעברה התחילו ב־28/11, ונוסעים
            בכרטיס רגיל. כדאי לבדוק באפליקציית BudapestGO.
          </li>
        </ul>
      </div>

      <h2 className="section-heading">
        <UtensilsCrossed size={24} aria-hidden style={{ color: "#24603d" }} /> אוכל כשר ושבת
      </h2>
      <div className="card tip-card">
        <p>
          במסעדות שאינן כשרות: מנות צמחוניות, פסטה, פיצה, או דגים עם קשקשים (סלמון, טונה, דניס). להימנע
          מפירות ים ומגולאש.
        </p>
        <p>
          <strong>שבת (27–28 בנובמבר):</strong> הדלקת נרות בערך 15:35, צאת שבת בערב 16:50. כדאי לוודא את
          השעות המדויקות ב־chabad.org. המסעדות הכשרות נסגרות בשישי בצהריים, ומגישות ארוחות שבת רק בהזמנה
          ובתשלום מראש.
        </p>
        <p>
          <strong>בית הכנסת הגדול (דוהאני)</strong> סגור בשבת. מתאים לביקור בחמישי או בראשון בבוקר.
        </p>
        <a className="secondary-button" href="/explore">
          לרשימת המקומות הכשרים <ChevronLeft size={20} />
        </a>
      </div>

      <h2 className="section-heading">
        <CalendarCheck size={24} aria-hidden style={{ color: "#b3372d" }} /> כדאי להזמין מראש
      </h2>
      <div className="card" style={{ padding: "4px 20px" }}>
        {BOOKINGS.map((b) => (
          <a key={b.what} className="booking-row" href={b.href} target="_blank" rel="noreferrer">
            <span className="booking-when">{b.when}</span>
            <span>
              <strong>{b.what}</strong>
              <br />
              <span className="small muted">{b.how}</span>
            </span>
            <ChevronLeft size={20} aria-hidden />
          </a>
        ))}
      </div>

      <h2 className="section-heading">
        <Phone size={24} aria-hidden style={{ color: "#b3372d" }} /> טלפונים
      </h2>
      <div className="card" style={{ padding: "4px 20px" }}>
        <a className="booking-row" href="tel:112">
          <span className="booking-when">112</span>
          <span>
            <strong>חירום בהונגריה</strong>
            <br />
            <span className="small muted">משטרה, אמבולנס, כיבוי אש</span>
          </span>
          <ChevronLeft size={20} aria-hidden />
        </a>
        <a className="booking-row" href="tel:+3614454800">
          <span className="booking-when">מלון</span>
          <span>
            <strong>Exe Budapest Center</strong>
            <br />
            <span className="small muted latin">+36 1 445 4800</span>
          </span>
          <ChevronLeft size={20} aria-hidden />
        </a>
      </div>

      <h2 className="section-heading">
        <Settings size={24} aria-hidden /> הגדרות
      </h2>
      <SettingsPanel />

      <div className="footer-note">
        <span>שעות ומחירים נבדקו באוקטובר 2026. שווה לבדוק שוב שבוע לפני.</span>
        <span>תמונות: ויקיפדיה ו־Wikimedia Commons. מפה: OpenStreetMap ו־CARTO.</span>
      </div>
    </>
  );
}
