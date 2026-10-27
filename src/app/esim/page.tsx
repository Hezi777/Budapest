import { Smartphone, Wrench } from "lucide-react";
import { EsimWalkthrough } from "@/components/esim-guide";

function Title({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="section-title">
      <span className="badge-icon">
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
    a: "בהגדרות הרשת מכבים בחירת רשת אוטומטית ובוחרים ידנית One (לשעבר Vodafone) או Yettel.",
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

      <Title icon={<Smartphone size={20} aria-hidden />}>
        התקנה צעד אחר צעד
      </Title>
      <EsimWalkthrough />

      <details className="card esim-trouble">
        <summary>
          <span className="badge-icon">
            <Wrench size={20} aria-hidden />
          </span>
          אם משהו לא עובד
        </summary>
        <ul className="bullets">
          {PROBLEMS.map((p) => (
            <li key={p.q}>
              <strong>{p.q}</strong>
              <br />
              <span className="muted">{p.a}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="footer-note">
        <span>מחירים וקודים נבדקו ב־27.10.2026 ועשויים להשתנות. Airalo לא קשורה לאתר הזה.</span>
      </div>
    </>
  );
}
