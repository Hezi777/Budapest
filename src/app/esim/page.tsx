import { CircleCheck, Smartphone, TicketPercent, Wrench } from "lucide-react";
import { CouponCode, InstallSteps } from "@/components/esim-guide";

function Title({ icon, color, bg, children }: { icon: React.ReactNode; color: string; bg: string; children: React.ReactNode }) {
  return (
    <h2 className="section-title">
      <span className="badge-icon" style={{ "--icon": color, "--icon-bg": bg } as React.CSSProperties}>
        {icon}
      </span>
      {children}
    </h2>
  );
}

const PROBLEMS = [
  {
    q: "נחתנו ואין אינטרנט",
    a: "לבדוק שנדידת נתונים דלוקה בקו של Airalo, ושהנתונים הסלולריים על Airalo. אם עדיין לא: מצב טיסה ל־10 שניות, או הפעלה מחדש של הטלפון.",
  },
  {
    q: "כתוב „אין שירות”",
    a: "בהגדרות הרשת מכבים בחירת רשת אוטומטית ובוחרים ידנית Vodafone HU או Yettel.",
  },
  {
    q: "הנפח נגמר",
    a: "באפליקציה של Airalo לוחצים על הכרטיס ← Top up, וקונים עוד נפח. לא צריך להתקין מחדש.",
  },
  {
    q: "הקוד לא עובד",
    a: "קודים עובדים רק בקנייה ראשונה ואי אפשר לשלב שניים. מנסים את הקוד השני. בכל מקרה זה עולה רק כמה אירו.",
  },
];

export default function EsimPage() {
  return (
    <>
      <div className="page-head">
        <h1 className="page-title">אינטרנט בחו״ל</h1>
        <p className="page-lead">
          במקום חבילת חו״ל יקרה: eSIM של Airalo. זה כרטיס סים דיגיטלי שמתקינים מהאפליקציה, בלי להוציא את הסים
          הישראלי. מספיק לוואטסאפ, מפות ו־Bolt לכל הטיול.
        </p>
      </div>

      <div className="plan-card">
        <span className="small" style={{ opacity: 0.8, fontWeight: 800 }}>החבילה שמתאימה לכם</span>
        <span style={{ fontSize: "1.3rem", fontWeight: 800 }}>
          הונגריה · <bdi>Szia!</bdi>
        </span>
        <span className="tags">
          <span className="tag latin">3GB</span>
          <span className="tag">7 ימים</span>
        </span>
        <span className="plan-price">
          <bdi className="latin">≈ €7.50</bdi>
        </span>
        <span className="small" style={{ opacity: 0.85 }}>
          גלישה בלבד (בלי מספר הונגרי). אפשר לשתף אינטרנט (Hotspot). 1GB לא יספיק לארבעה ימים עם מפות.
        </span>
      </div>

      <Title icon={<Smartphone size={20} aria-hidden />} color="#2b4c80" bg="#e5edf9">
        לבדוק קודם שהטלפון מתאים
      </Title>
      <div className="card">
        <div className="check-row">
          <CircleCheck size={20} aria-hidden />
          <span>
            מחייגים <bdi dir="ltr"><strong>*#06#</strong></bdi>. אם מופיעה שורה בשם <strong>EID</strong>, הטלפון תומך ב־eSIM.
          </span>
        </div>
        <div className="check-row">
          <CircleCheck size={20} aria-hidden />
          <span>בדרך כלל: אייפון XS ומעלה, סמסונג Galaxy S20 ומעלה.</span>
        </div>
        <div className="check-row">
          <CircleCheck size={20} aria-hidden />
          <span>הטלפון צריך להיות „פתוח” ולא נעול לחברה סלולרית. טלפון שנקנה בחנות רגילה בארץ בדרך כלל פתוח.</span>
        </div>
      </div>

      <Title icon={<TicketPercent size={20} aria-hidden />} color="#7a5200" bg="#fcf0d4">
        קודי הנחה
      </Title>
      <div className="stack">
        <CouponCode
          code="NEWTOAIRALO15"
          title="15% הנחה לנרשמים חדשים"
          note="דווח כעובד באתרי קופונים בסוף אוקטובר 2026"
        />
        <div className="card card-pad stack">
          <strong>3$ הנחה עם קוד הזמנה מחבר</strong>
          <p className="small muted">
            מי שכבר יש לו חשבון Airalo (למשל הילדים) מוצא באפליקציה את „Refer & earn” ושולח לכם קוד אישי. אתם
            מקבלים 3$ הנחה, והוא מקבל 3$ לקנייה הבאה. זה המבצע הרשמי של Airalo.
          </p>
        </div>
        <p className="small muted">אי אפשר לשלב שני קודים. מנסים את הראשון, ואם לא עובד את השני.</p>
      </div>

      <Title icon={<Smartphone size={20} aria-hidden />} color="#1f6a3f" bg="#e2f2e7">
        התקנה צעד אחר צעד
      </Title>
      <InstallSteps />

      <Title icon={<Wrench size={20} aria-hidden />} color="#a3302a" bg="#fdeae8">
        אם משהו לא עובד
      </Title>
      <div className="card">
        <ul className="bullets">
          {PROBLEMS.map((p) => (
            <li key={p.q}>
              <strong>{p.q}</strong>
              <br />
              <span className="muted">{p.a}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="footer-note">
        <span>מחירים וקודים נבדקו ב־27.10.2026 ועשויים להשתנות. Airalo לא קשורה לאתר הזה.</span>
      </div>
    </>
  );
}
