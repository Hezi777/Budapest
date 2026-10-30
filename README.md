# Budapest · 26–29 Nov 2026

A mobile web app for Edna and Benny's Budapest trip: the day-by-day plan from the
PDF guide, a map, more ideas (with a kosher filter), a forint ⇄ shekel
converter and practical tips. Hebrew, right-to-left, large text by default.
The design follows Hen Helper.

## What it does

| Tab | |
|---|---|
| התוכנית (Plan) | Illustrated hero with a countdown, quick actions (hotel, day map, internet, emergency), date strip, and a numbered timeline: photo cards with expandable descriptions, walking/taxi legs with Bolt-ready addresses, navigation and "we were here" ticks. Edit mode: reorder, retime, rename, move day, delete, add. Share a day to WhatsApp. |
| מפה (Map) | Numbered pins per day with the route, all days, kosher, or ideas. "Where am I?" button. |
| רעיונות (Ideas) | ~30 researched extra places plus the kosher list as photo cards, searchable and filterable, one tap to add to any day. |
| כסף (Money) | Live HUF ⇄ ILS rate, quick amounts, common prices, card-payment tip. |
| מידע (Info) | Emergency numbers (Hungary, Israeli MFA and embassy, doctors, insurers, cards), Bolt how-to, Christmas markets, kosher & Shabbat, bookings, settings. |
| `/esim` | Airalo eSIM guide: which plan, compatibility check, discount codes, iPhone and Samsung steps, troubleshooting. |

Changes are saved on the phone (localStorage). Each phone keeps its own copy.

## Photos

Photos are fetched live by `/api/photo` and cached by Vercel for a week:

1. **Google Places** — only if `GOOGLE_PLACES_API_KEY` is set in Vercel. Gives
   real photos of restaurants and cafés too.
2. **Wikipedia** lead image for sights.
3. **Wikimedia Commons**, kept only when the file name matches the place.

Without a photo, a card shows a category icon, as the printed guide did.

## Deploy on Vercel

1. In Vercel: **Add New → Project → Import** `Hezi777/Budapest`. Framework is
   detected as Next.js; no settings needed.
2. Optional: add `GOOGLE_PLACES_API_KEY` (Places API (New) enabled) under
   Settings → Environment Variables, then redeploy.

Every push to `main` redeploys.

## Develop

```bash
pnpm install
pnpm dev
```

`pnpm lint` and `pnpm build` before pushing. `node scripts/generate-icons.mjs`
re-renders the PNG icons from `public/icon.svg`.
