import Link from "next/link";
import {
  BedDouble,
  CalendarCheck,
  CarTaxiFront,
  ChevronLeft,
  Coins,
  Languages,
  MessageCircle,
  Navigation,
  Phone,
  Pill,
  Plug,
  Settings,
  ShieldAlert,
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
import { PackingList } from "@/components/packing-list";
import { SettingsPanel } from "@/components/settings-panel";
import { Topic } from "@/components/topic";
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
 * A few words for the trip. The transliteration is approximate: ö is about
 * "או", sz is "ס", s is "ש", gy is "ג׳", cs is "צ׳".
 */
const WORDS: { hu: string; sound: string; he: string }[] = [
  { hu: "Jó napot", sound: "יו נאפוט", he: "שלום / יום טוב" },
  { hu: "Köszönöm", sound: "קוסונום", he: "תודה" },
  { hu: "Kérem", sound: "קרם", he: "בבקשה" },
  { hu: "Igen / Nem", sound: "איגן / נם", he: "כן / לא" },
  { hu: "Elnézést", sound: "אלנזשט", he: "סליחה" },
  { hu: "Mennyibe kerül?", sound: "מניבה קרול", he: "כמה זה עולה?" },
  { hu: "A számlát, kérem", sound: "א סאמלאט, קרם", he: "החשבון, בבקשה" },
  { hu: "Beszél angolul?", sound: "בסל אנגולול", he: "מדברים אנגלית?" },
  { hu: "Nem beszélek magyarul", sound: "נם בסלק מג׳ארול", he: "אני לא מדבר הונגרית" },
  { hu: "Segítség!", sound: "שגיצ׳ג", he: "הצילו / עזרה" },
  { hu: "Viszontlátásra", sound: "ויסונטלאטשרה", he: "להתראות" },
];

/** A time or date range kept left-to-right, so "11:00–21:00" doesn't read backwards in RTL text. */
const R = ({ children }: { children: string }) => <bdi dir="ltr">{children}</bdi>;

/** Wraps every "9:00–12:00" in a text with R. */
function withRanges(text: string): React.ReactNode[] {
  return text.split(/(\d{1,2}:\d{2}–\d{1,2}:\d{2})/).map((part, i) => (i % 2 ? <R key={i}>{part}</R> : part));
}

/** One short fact: icon, a big word, one line under it. */
function Tile({ icon, big, children }: { icon: React.ReactNode; big: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="info-tile">
      <span className="info-tile-icon">{icon}</span>
      <div className="grow">
        <div className="big">{big}</div>
        <p className="muted">{children}</p>
      </div>
    </div>
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
      <a className="sos-call" href="tel:112" aria-label="התקשרות ל־112, מוקד חירום אירופי">
        <span className="sos-call-main">
          <span className="sos-call-label">
            <Phone size={22} aria-hidden /> התקשרות לחירום
          </span>
          <span className="sos-call-sub">משטרה, אמבולנס וכבאים. עונים באנגלית.</span>
        </span>
        <span className="num">112</span>
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
                  className="contact-row"
                  href={telHref(c)}
                  target={c.whatsapp ? "_blank" : undefined}
                  rel={c.whatsapp ? "noreferrer" : undefined}
                >
                  <span className="grow">
                    <span className="contact-name">{c.name}</span>
                    <bdi className="contact-num" dir="ltr">
                      {c.phone}
                    </bdi>
                    {c.note && <span className="contact-note">{withRanges(c.note)}</span>}
                  </span>
                  <span className="contact-act">
                    {c.whatsapp ? <MessageCircle size={20} aria-hidden /> : <Phone size={20} aria-hidden />}
                    {c.whatsapp ? "וואטסאפ" : "חיוג"}
                  </span>
                </a>
              ))}
            </div>
          </details>
        ))}
      </div>
      <p className="info-fine">
        מספרי הביטוח והאשראי נבדקו באוקטובר 2026. כדאי לוודא מול הפוליסה ומול גב הכרטיס, ולצלם את שניהם לפני
        הטיסה. מד״א (101) ומשטרת ישראל (100) לא עובדים מחו״ל.
      </p>

      <h2 className="info-heading">נושאים</h2>
      <div className="card topic-list">
        <Topic id="hotel" icon={<BedDouble size={22} aria-hidden />} title="המלון" hint="כתובת, ניווט והתקשרות">
          <div className="stack">
            <div>
              <div className="title latin" style={{ textAlign: "start", fontWeight: 800, fontSize: "1.2rem" }}>
                {HOTEL.local}
              </div>
              <div className="muted latin" style={{ textAlign: "start" }}>
                Kossuth Lajos utca 7-9
              </div>
              <div className="muted">ליד תחנת המטרו Astoria (קו M2)</div>
            </div>
            <div className="btn-row">
              <a className="btn btn-primary" href={directionsUrl(HOTEL)} target="_blank" rel="noreferrer">
                <Navigation size={18} aria-hidden /> ניווט למלון
              </a>
              <a className="btn btn-outline" href={`tel:${HOTEL.phone!.replace(/\s/g, "")}`}>
                <Phone size={18} aria-hidden /> התקשרות למלון
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
            <h3 className="topic-sub">איך מזמינים מונית</h3>
            <ol className="steps">
              <li>מורידים את Bolt עוד בארץ, ונרשמים עם מספר הטלפון וכרטיס אשראי.</li>
              <li>בכל קטע מונית בתוכנית יש כתובת באנגלית. לוחצים עליה, היא מועתקת, ומדביקים ב־Bolt.</li>
              <li>המחיר מופיע מראש ומחויב אוטומטית. לא צריך מזומן.</li>
              <li>
                לא עוצרים מוניות ברחוב: רק Bolt, או עמדת Főtaxi הרשמית בשדה התעופה. מונית רחוב לשדה יכולה לעלות
                פי 3.
              </li>
            </ol>
            <StoreLinks {...BOLT_APP} />
          </div>
          <h3 className="topic-sub is-spaced">בנחיתה ובעיר</h3>
          <ul className="bullets info-bullets">
            <li>
              <strong>ביקורת דרכונים:</strong> מאז 2026 יש רישום ביומטרי חדש (EES) לישראלים, והתור יכול להתארך.
              לא לתכנן משהו צמוד לנחיתה.
            </li>
            <li>
              <strong>מטרו ואוטובוס 100E לשדה:</strong> אפשר לשלם בכניסה בהצמדת כרטיס אשראי (כרטיס בודד). המלון ליד
              תחנת Astoria בקו M2.
            </li>
          </ul>
        </Topic>

        <PackingList />

        <div className="topic">
          <Link href="/esim" className="topic-head">
            <span className="topic-icon">
              <Wifi size={22} aria-hidden />
            </span>
            <span className="grow">
              <span className="topic-title">אינטרנט בחו״ל</span>
              <span className="topic-hint">מדריך eSIM עם קוד הנחה</span>
            </span>
            <ChevronLeft size={24} aria-hidden className="topic-go" />
          </Link>
        </div>

        <Topic id="kosher" icon={<UtensilsCrossed size={22} aria-hidden />} title="אוכל כשר ושבת" hint="זמני שבת ומה לאכול" flush>
          <ul className="bullets">
            <li>
              <strong>במסעדות שאינן כשרות:</strong> מנות צמחוניות, פסטה, פיצה, או דגים עם קשקשים (סלמון, טונה,
              דניס). להימנע מפירות ים ומגולאש.
            </li>
            <li>
              <strong>שבת (<R>27–28</R> בנובמבר):</strong> הדלקת נרות בערך 15:35, צאת שבת בערך 16:50 (לוודא ב־chabad.org).
            </li>
            <li>
              <strong>ארוחות שבת:</strong> המסעדות הכשרות נסגרות בשישי בצהריים, ומגישות ארוחות שבת רק בהזמנה
              ובתשלום מראש.
            </li>
            <li>
              <strong>בית הכנסת הגדול (דוהאני)</strong> סגור בשבת. מתאים לחמישי או לראשון בבוקר.
            </li>
          </ul>
          <div className="topic-actions">
            <Link className="btn btn-outline btn-block" href="/explore">
              לכל המקומות הכשרים <ChevronLeft size={18} aria-hidden />
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
              <strong>שוק ורשמרטי:</strong> בערך <R>11:00–21:00</R> (שישי־שבת עד 22:00). משלמים בכרטיס.
            </li>
            <li>
              <strong>שוק הבזיליקה:</strong> <R>11:00–22:00</R> (שישי־שבת עד 23:00), עם מופע אורות על החזית מ־17:30, כל
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

        <Topic
          id="good-to-know"
          icon={<Snowflake size={22} aria-hidden />}
          title="טוב לדעת"
          hint="קור, שקיעה, שקעים, כיסים ובית מרקחת"
          flush
        >
          <div className="info-tiles">
            <Tile icon={<Snowflake size={24} aria-hidden />} big={<bdi dir="ltr">0–7°</bdi>}>
              קר. מעיל, כפפות, כובע ונעליים נוחות.
            </Tile>
            <Tile icon={<Sunset size={24} aria-hidden />} big="שקיעה ב־15:55">
              בחמש כבר חושך, והשווקים נדלקים.
            </Tile>
            <Tile icon={<Coins size={24} aria-hidden />} big="פורינט">
              1,000 פורינט שווים בערך 9 ₪. אשראי עובד כמעט בכל מקום.
            </Tile>
            <Tile icon={<Wine size={24} aria-hidden />} big="בלי אלכוהול">
              בשווקים: gyerekpuncs או שוקו חם. לבני: בירה Dreher.
            </Tile>
            <Tile icon={<Plug size={24} aria-hidden />} big="שקעים">
              230V, סוג C/F. התקע הישראלי עם שני פינים מתאים. תקע עם שלושה פינים צריך מתאם.
            </Tile>
            <Tile icon={<ShieldAlert size={24} aria-hidden />} big="כייסים">
              בשווקים הצפופים, במטרו וב־<bdi dir="ltr">Váci utca</bdi>: התיק מלפנים, והטלפון לא בכיס אחורי.
            </Tile>
            <Tile icon={<Pill size={24} aria-hidden />} big="בית מרקחת">
              בהונגרית: <bdi dir="ltr">Gyógyszertár</bdi>. מחפשים שלט עם צלב ירוק.
            </Tile>
          </div>
        </Topic>

        <Topic id="words" icon={<Languages size={22} aria-hidden />} title="מילים בהונגרית" hint="תודה, בבקשה, כמה זה עולה" flush>
          <ul className="word-list">
            {WORDS.map((w) => (
              <li key={w.hu} className="word-row">
                <span className="word-he">{w.he}</span>
                <bdi className="word-hu" dir="ltr">
                  {w.hu}
                </bdi>
                <span className="word-sound">איך אומרים: {w.sound}</span>
              </li>
            ))}
          </ul>
          <p className="info-fine is-inset">התעתיק משוער.</p>
        </Topic>

        <Topic id="bookings" icon={<CalendarCheck size={22} aria-hidden />} title="הזמנות" hint="מה כדאי להזמין מראש" flush>
          <div className="list">
            {BOOKINGS.map((b) => (
              <a key={b.what} className="list-row book-row" href={b.href} target="_blank" rel="noreferrer">
                <span className="grow">
                  <span className="book-when">{b.when}</span>
                  <span className="book-what">{b.what}</span>
                  <span className="book-how">{b.how}</span>
                </span>
                {b.href.startsWith("tel:") ? <Phone size={22} aria-label="חיוג" /> : <ChevronLeft size={22} aria-hidden />}
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
