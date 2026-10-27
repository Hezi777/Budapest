/**
 * Phone numbers for the emergency section. Researched October 2026; only
 * numbers confirmed by an official page or several consistent sources.
 */
export type Contact = {
  name: string;
  phone: string;
  note?: string;
  /** Opens WhatsApp instead of the dialler. */
  whatsapp?: boolean;
};

export type ContactGroup = {
  title: string;
  contacts: Contact[];
};

export const EMERGENCY_GROUPS: ContactGroup[] = [
  {
    title: "חירום בהונגריה",
    contacts: [
      { name: "אמבולנס", phone: "104" },
      { name: "משטרה", phone: "107" },
      { name: "כיבוי אש", phone: "105" },
      {
        name: "מוקד תיירים באנגלית",
        phone: "+36 1 438 8080",
        note: "דיווח על גניבה או אובדן, באנגלית",
      },
    ],
  },
  {
    title: "ישראלים בחו״ל",
    contacts: [
      {
        name: "חמ״ל משרד החוץ (24/7)",
        phone: "+972 2 530 3155",
        note: "לכל מצוקה של ישראלי בחו״ל, בכל שעה",
      },
      { name: "חמ״ל משרד החוץ בוואטסאפ", phone: "+972 50 507 3969", whatsapp: true },
      {
        name: "שגרירות ישראל בבודפשט",
        phone: "+36 1 392 6200",
        note: "Fullánk utca 8 · א׳–ה׳ 9:00–12:00",
      },
      { name: "השגרירות: מחלקה קונסולרית", phone: "+36 1 392 6278", note: "דרכון אבוד, מסמכים" },
    ],
  },
  {
    title: "רופא ובית חולים",
    contacts: [
      {
        name: "FirstMed · מרפאה פרטית באנגלית",
        phone: "+36 1 224 9090",
        note: "קו דחוף 24 שעות · Hattyú utca 14",
      },
      {
        name: "מיון אוניברסיטת זמלווייס",
        phone: "+36 1 459 1500",
        note: "Üllői út 78/A · כ־10 דק' במונית מהמלון",
      },
      {
        name: "בית מרקחת תורן",
        phone: "+36 1 445 4800",
        note: "שואלים בקבלה של המלון איזה בית מרקחת פתוח עכשיו",
      },
    ],
  },
  {
    title: "ביטוח נסיעות (מוקד בחו״ל)",
    contacts: [
      { name: "הפניקס", phone: "+972 3 714 1000" },
      { name: "הפניקס בוואטסאפ", phone: "+972 50 224 1953", whatsapp: true },
      { name: "הראל", phone: "+972 3 754 7030" },
      { name: "פספורטכארד", phone: "+972 9 892 0930" },
      { name: "מגדל", phone: "+972 3 920 6912" },
    ],
  },
  {
    title: "כרטיס אשראי אבד או נגנב",
    contacts: [
      { name: "ישראכרט", phone: "+972 3 636 4400" },
      { name: "כאל", phone: "+972 3 572 6333" },
      { name: "מקס", phone: "+972 3 617 8800" },
    ],
  },
  {
    title: "שימושי",
    contacts: [
      { name: "המלון · Exe Budapest Center", phone: "+36 1 445 4800" },
      { name: "בית חב״ד בודפשט", phone: "+36 1 266 0308", note: "Károly körút 20" },
      { name: "שדה התעופה של בודפשט", phone: "+36 1 296 7000" },
    ],
  },
];

export function telHref(contact: Contact): string {
  const digits = contact.phone.replace(/[^\d+]/g, "");
  return contact.whatsapp ? `https://wa.me/${digits.replace("+", "")}` : `tel:${digits}`;
}
