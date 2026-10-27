import Link from "next/link";
import {
  CalendarCheck,
  CarTaxiFront,
  ChevronLeft,
  Coins,
  MessageCircle,
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
import { SettingsPanel } from "@/components/settings-panel";
import { EMERGENCY_GROUPS, telHref } from "@/lib/emergency";

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

function Title({ icon, color, bg, children, id }: { icon: React.ReactNode; color: string; bg: string; children: React.ReactNode; id?: string }) {
  return (
    <h2 className="section-title" id={id} style={{ scrollMarginTop: 70 }}>
      <span className="badge-icon" style={{ "--icon": color, "--icon-bg": bg } as React.CSSProperties}>
        {icon}
      </span>
      {children}
    </h2>
  );
}

export default function InfoPage() {
  return (
    <>
      <div className="page-head">
        <h1 className="page-title">מידע שימושי</h1>
        <p className="page-lead">טלפונים לחירום, אינטרנט בחו״ל, מוניות, כשרות וכל השאר.</p>
      </div>

      <Link href="/esim" className="card link-tile">
        <span className="lead" style={{ "--icon": "#1f6a3f", "--icon-bg": "#e2f2e7" } as React.CSSProperties}>
          <Wifi size={26} aria-hidden />
        </span>
        <span className="grow">
          <span className="title">אינטרנט בחו״ל: מדריך eSIM</span>
          <br />
          <span className="muted small">Airalo, צעד אחר צעד, עם קוד הנחה</span>
        </span>
        <ChevronLeft size={22} aria-hidden />
      </Link>

      <Title id="sos" icon={<Siren size={20} aria-hidden />} color="#fff" bg="#c8372d">
        טלפונים לחירום
      </Title>
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
        {EMERGENCY_GROUPS.map((group) => (
          <section key={group.title} className="card" aria-label={group.title}>
            <h3 style={{ padding: "14px 16px 4px", fontSize: "1rem", color: group.color }}>{group.title}</h3>
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
                  <span className="lead" style={{ "--icon": group.color, "--icon-bg": group.bg } as React.CSSProperties}>
                    {c.whatsapp ? <MessageCircle size={20} aria-label="וואטסאפ" /> : <Phone size={20} aria-label="חיוג" />}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="small muted" style={{ marginBlockStart: 10 }}>
        מספרי הביטוח והאשראי נבדקו באוקטובר 2026. כדאי לוודא מול הפוליסה ומול גב הכרטיס, ולצלם את שניהם לפני
        הטיסה. מד״א (101) ומשטרת ישראל (100) לא עובדים מחו״ל.
      </p>

      <Title icon={<CarTaxiFront size={20} aria-hidden />} color="#3d2b00" bg="#f7c948">
        מוניות: אפליקציית Bolt
      </Title>
      <div className="card card-pad stack">
        <ol className="steps" style={{ "--step": "#b07a00" } as React.CSSProperties}>
          <li>מורידים את Bolt עוד בארץ, ונרשמים עם מספר הטלפון וכרטיס אשראי.</li>
          <li>בכל פס צהוב בתוכנית יש כתובת באנגלית. לוחצים עליה, היא מועתקת, ומדביקים ב־Bolt.</li>
          <li>המחיר מופיע מראש ומחויב אוטומטית. לא צריך מזומן.</li>
          <li>לא עוצרים מוניות ברחוב. בשדה התעופה: עמדת Főtaxi הרשמית או Bolt.</li>
        </ol>
        <a className="btn btn-navy" href="https://bolt.eu/he-il/" target="_blank" rel="noreferrer">
          להורדת Bolt
        </a>
      </div>

      <div className="info-grid" style={{ marginBlockStart: 12 }}>
        <div className="card info-tile" style={{ "--icon": "#2b4c80" } as React.CSSProperties}>
          <Snowflake size={22} aria-hidden />
          <div className="big latin" style={{ textAlign: "start" }}>0–7°</div>
          <p className="small muted">קר. מעיל, כפפות, כובע ונעליים נוחות.</p>
        </div>
        <div className="card info-tile" style={{ "--icon": "#b06a1d" } as React.CSSProperties}>
          <Sunset size={22} aria-hidden />
          <div className="big">15:55</div>
          <p className="small muted">שקיעה. בחמש כבר חושך, והשווקים נדלקים.</p>
        </div>
        <div className="card info-tile" style={{ "--icon": "#1f6a3f" } as React.CSSProperties}>
          <Coins size={22} aria-hidden />
          <div className="big">פורינט</div>
          <p className="small muted">1,000 פורינט ≈ 10 ₪. אשראי עובד כמעט בכל מקום.</p>
        </div>
        <div className="card info-tile" style={{ "--icon": "#9d2323" } as React.CSSProperties}>
          <Wine size={22} aria-hidden />
          <div className="big">בלי אלכוהול</div>
          <p className="small muted">בשווקים: gyerekpuncs או שוקו חם. לאבא: בירה Dreher.</p>
        </div>
      </div>

      <Title icon={<TreePine size={20} aria-hidden />} color="#9d2323" bg="#fde6e6">
        כריסמס בבודפשט
      </Title>
      <div className="card">
        <ul className="bullets">
          <li>
            <strong>שוק ורשמרטי:</strong> בערך 11:00–21:00 (שישי־שבת עד 22:00). משלמים בכרטיס.
          </li>
          <li>
            <strong>שוק הבזיליקה:</strong> 11:00–22:00 (שישי־שבת עד 23:00), עם מופע אורות על החזית מ־17:30, כל חצי
            שעה. נבחר שוב לשוק הכריסמס הטוב באירופה.
          </li>
          <li>
            <strong>לטעום:</strong> קירטוש (עוגת ארובה), לאנגוש עם שמנת וגבינה, ערמונים קלויים.
          </li>
          <li>
            <strong>החשמלית המוארת:</strong> בשנה שעברה התחילה ב־28/11 ונוסעים בכרטיס רגיל. לבדוק באפליקציית
            BudapestGO.
          </li>
        </ul>
      </div>

      <Title icon={<UtensilsCrossed size={20} aria-hidden />} color="#1f6a3f" bg="#e2f2e7">
        אוכל כשר ושבת
      </Title>
      <div className="card card-pad stack">
        <p>
          במסעדות שאינן כשרות: מנות צמחוניות, פסטה, פיצה, או דגים עם קשקשים (סלמון, טונה, דניס). להימנע מפירות ים
          ומגולאש.
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

      <Title icon={<CalendarCheck size={20} aria-hidden />} color="#a3302a" bg="#fdeae8">
        כדאי להזמין מראש
      </Title>
      <div className="card list">
        {BOOKINGS.map((b) => (
          <a key={b.what} className="list-row" href={b.href} target="_blank" rel="noreferrer">
            <span className="lead" style={{ "--icon": "#a3302a", "--icon-bg": "#fdeae8", fontSize: "0.78rem", lineHeight: 1.15, textAlign: "center" } as React.CSSProperties}>
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

      <Title icon={<Settings size={20} aria-hidden />} color="#1f2a44" bg="#ecebe8">
        הגדרות
      </Title>
      <SettingsPanel />

      <div className="footer-note">
        <span>שעות, מחירים וטלפונים נבדקו באוקטובר 2026. שווה לבדוק שוב שבוע לפני.</span>
        <span>תמונות: ויקיפדיה ו־Wikimedia Commons. מפה: OpenStreetMap ו־CARTO.</span>
      </div>
    </>
  );
}
