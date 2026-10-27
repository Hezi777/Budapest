import { HOTEL_ID } from "./places";
import type { Day, Leg, Stop, Trip } from "./types";

/** Bump when the seed plan changes in a way saved plans should pick up. */
export const TRIP_VERSION = 2;

export const TRIP_INFO = {
  title: "בודפשט",
  dates: "26–29 בנובמבר 2026",
};

export const DAY_COLORS = ["#3b6fb6", "#2f8f6a", "#c27c1a", "#8b5cc4"];

const HOTEL_BOLT = "Kossuth Lajos utca 7-9";

type SeedStop = Omit<Stop, "id">;

function day(
  id: string,
  fields: Omit<Day, "id" | "stops"> & { stops: SeedStop[] },
): Day {
  let prev: string | undefined;
  const stops = fields.stops.map((stop, i) => {
    const withFrom: Stop = {
      ...stop,
      id: `${id}-${i + 1}`,
      leg: stop.leg && prev ? { ...stop.leg, from: prev } : stop.leg,
    };
    if (stop.placeId) prev = stop.placeId;
    return withFrom;
  });
  const end = fields.end && { ...fields.end, from: prev, to: fields.end.to ?? HOTEL_ID };
  return { ...fields, id, stops, end };
}

const walk = (text: string): Leg => ({ mode: "walk", text });
const taxi = (text: string, boltTo: string): Leg => ({ mode: "taxi", text, boltTo });

export const SEED_DAYS: Day[] = [
  day("d1", {
    date: "2026-11-26",
    label: "חמישי · 26 בנובמבר",
    title: "נחיתה, ואצי ושייט בדנובה",
    summary:
      "יום רגוע אחרי הטיסה: שוק כריסמס, קניות בוואצי, מנוחה, ובערב שייט על הנהר.",
    color: DAY_COLORS[0],
    stops: [
      { time: "10:00", placeId: "airport", title: "נחיתה בבודפשט" },
      {
        time: "11:15",
        placeId: HOTEL_ID,
        title: "המלון: משאירים מזוודות",
        leg: taxi("מונית למלון · 30–40 דק' · כ־11,000–14,000 פורינט", HOTEL_BOLT),
      },
      {
        time: "12:00",
        placeId: "twentysix",
        title: "צהריים ב־Twentysix",
        leg: walk("15 דק' הליכה (או מונית קצרה, כ־2,000 פורינט)"),
      },
      {
        time: "13:45",
        placeId: "vorosmarty",
        leg: walk("17 דק' הליכה דרך כיכר Deák"),
      },
      {
        time: "15:00",
        placeId: "vaci",
        leg: walk("ממשיכים ברגל, ישר לתוך ואצי"),
      },
      {
        time: "15:45",
        placeId: HOTEL_ID,
        title: "חוזרים למלון",
        note: "צ'ק־אין ומנוחה. בחמש כבר חושך.",
        compact: true,
      },
      {
        time: "18:00",
        placeId: "legenda",
        leg: walk("12 דק' הליכה לנהר"),
      },
      {
        time: "19:30",
        placeId: "carmel",
        title: "ערב כשר ב־Carmel",
        leg: taxi("מונית לרובע היהודי · 10 דק' · כ־2,500 פורינט", "Kazinczy utca 31"),
      },
    ],
    end: walk("12 דק' הליכה חזרה למלון"),
  }),
  day("d2", {
    date: "2026-11-27",
    label: "שישי · 27 בנובמבר",
    title: "צד בודה: המבצר והטירה",
    summary:
      "עולים לגבעה במונית, יורדים ברכבל הקטן וחוצים את הגשר ברגל. אחר הצהריים קניון.",
    color: DAY_COLORS[1],
    stops: [
      { time: "09:00", placeId: "cirkusz", title: "בוקר ב־Cirkusz Café" },
      {
        time: "10:00",
        placeId: "bastion",
        leg: taxi("מונית לגבעת הטירה · 15–20 דק' · כ־4,000–5,000 פורינט", "Szentháromság tér"),
      },
      {
        time: "12:00",
        placeId: "jamies",
        title: "צהריים ב־Jamie's Italian",
        leg: walk("2 דק' הליכה"),
      },
      {
        time: "13:15",
        placeId: "castle",
        leg: walk("12 דק' הליכה במישור לאורך החומה"),
      },
      {
        time: "14:00",
        placeId: "siklo",
        title: "יורדים ברכבל ההיסטורי",
        leg: walk("2 דק' לתחנת הרכבל"),
      },
      { time: "14:15", placeId: "chain-bridge" },
      {
        time: "14:45",
        placeId: "strudel",
        title: "שטרודל וקפה",
        leg: walk("10 דק' הליכה"),
      },
      {
        time: "15:45",
        placeId: "arena",
        title: "קניות ב־Arena Mall",
        leg: taxi("מונית לקניון · 15 דק' · כ־4,000 פורינט", "Arena Mall, Kerepesi út 9"),
      },
      {
        time: "18:30",
        placeId: HOTEL_ID,
        title: "מנוחה במלון",
        compact: true,
        leg: taxi("מונית למלון · 15 דק' · כ־3,500 פורינט", HOTEL_BOLT),
      },
      {
        time: "20:00",
        placeId: "aleli",
        title: "ערב איטלקי ב־Alelí",
        leg: walk("13 דק' הליכה (או מונית קצרה, כ־2,000 פורינט)"),
        alts: [
          {
            placeId: "pomodoro",
            text: "חלופה: Trattoria Pomo D'Oro. טרטוריה איטלקית קלאסית, ליד הבזיליקה.",
          },
          {
            placeId: "hanna",
            text: "חלופה כשרה: ארוחת ליל שבת בחנה או בכרמל. מזמינים ומשלמים מראש, עד שישי ב־14:00.",
            kosher: true,
          },
        ],
      },
    ],
    end: walk("13 דק' הליכה חזרה למלון (או מונית)"),
  }),
  day("d3", {
    date: "2026-11-28",
    label: "שבת · 28 בנובמבר",
    title: "יום קניות ושוק הבזיליקה",
    summary:
      "בוקר בשוק הגדול, צהריים ב־Time Out, אחר הצהריים קניון, ובערב שוק הכריסמס היפה בעיר.",
    color: DAY_COLORS[2],
    stops: [
      { time: "09:30", placeId: "parisi", title: "בוקר בפסאז' פריז" },
      {
        time: "10:30",
        placeId: "market-hall",
        leg: walk("10 דק' הליכה בקצה הדרומי של ואצי"),
      },
      {
        time: "12:15",
        placeId: "timeout",
        title: "צהריים ב־Time Out Market",
        leg: taxi("מונית · 10 דק' · כ־3,000 פורינט", "Blaha Lujza tér 1"),
        alts: [
          {
            placeId: "carmel",
            text: "חלופה כשרה: ארוחת צהריים של שבת בכרמל, בהזמנה ובתשלום מראש. המסעדות הכשרות לא פתוחות בשבת בלי הזמנה.",
            kosher: true,
          },
        ],
      },
      {
        time: "13:45",
        placeId: "westend",
        title: "קניות ב־Westend",
        leg: taxi("מונית לקניון · 15 דק' · כ־3,500 פורינט", "Westend, Váci út 1-3"),
      },
      {
        time: "16:45",
        placeId: HOTEL_ID,
        title: "מנוחה קצרה במלון",
        compact: true,
        leg: taxi("מונית למלון להוריד שקיות · כ־3,500 פורינט", HOTEL_BOLT),
      },
      {
        time: "17:45",
        placeId: "basilica",
        leg: taxi("מונית · 10 דק' · כ־2,500 פורינט", "Szent István tér"),
      },
      {
        time: "19:15",
        placeId: "hotstone",
        leg: walk("3 דק' הליכה"),
        alts: [
          {
            placeId: "art-of-sushi",
            text: "חלופה דגים באותו אזור: Art of Sushi. סושי, סלמון וטונה.",
          },
        ],
      },
    ],
    end: taxi("מונית למלון · כ־2,500 פורינט", HOTEL_BOLT),
  }),
  day("d4", {
    date: "2026-11-29",
    label: "ראשון · 29 בנובמבר",
    title: "קניות אחרונות וטיסה הביתה",
    summary:
      "הכול ברגל ליד המלון. הכלל: יוצאים מהמלון לשדה 3 שעות לפני ההמראה.",
    color: DAY_COLORS[3],
    stops: [
      { time: "09:00", placeId: "telaviv", title: "בוקר כשר ב־Tel Aviv Café" },
      {
        time: "10:15",
        placeId: HOTEL_ID,
        title: "צ'ק־אאוט",
        note: "משאירים מזוודות בקבלה.",
        compact: true,
        leg: walk("12 דק' הליכה למלון"),
      },
      {
        time: "10:45",
        placeId: "vaci",
        title: "סיבוב קניות אחרון",
        note: "ואצי, רחוב האופנה שמקביל לה, ושוק הכריסמס בוורשמרטי שנפתח ב־11:00. בראשון חלק מהחנויות פותחות מאוחר או סוגרות מוקדם.",
        leg: walk("10 דק' הליכה"),
      },
      {
        time: "12:30",
        placeId: "carmel",
        title: "צהריים כשרים ב־Carmel",
        note: "רק אם הטיסה אחרי 16:00. כרמל פתוחה גם בראשון.",
        leg: walk("15 דק' הליכה (או מונית קצרה)"),
      },
      {
        time: "13:45",
        placeId: HOTEL_ID,
        title: "אוספים מזוודות",
        compact: true,
        leg: walk("12 דק' הליכה למלון"),
      },
    ],
    end: {
      ...taxi(
        "מונית לשדה התעופה · 30–40 דק' · כ־11,000–14,000 פורינט",
        "Budapest Airport Terminal 2",
      ),
      to: "airport",
    },
  }),
];

export function seedTrip(): Trip {
  return {
    version: TRIP_VERSION,
    days: structuredClone(SEED_DAYS),
    customPlaces: [],
  };
}
