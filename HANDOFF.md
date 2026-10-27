# Handoff: Budapest trip app

State as of 2026-10-27. Read `AGENTS.md` first for conventions; this file is
the "where we are and what's next" on top of it.

## What this is

A mobile web app (Next.js 16, Hebrew, RTL) for Hen's parents (50s–60s, not
technical) on a Budapest trip, Thu 26 – Sun 29 Nov 2026. It started from a
printed PDF guide (`Budapest-Parents-26-29-Nov.pdf`, not in the repo) whose
content is transcribed into `src/lib/trip.ts` and `src/lib/places.ts`. Design
follows Hen Helper (`Hezi777/Hen-Helper`), with the itinerary layout inspired by
Wanderlog.

## Status

- `main` is pushed and builds. `pnpm lint` and `pnpm build` are clean.
- **Not deployed yet.** The cloud sandbox it was built in can't reach Vercel.
  Hen deploys by importing `Hezi777/Budapest` in Vercel (Add New → Project →
  Import → Deploy, no settings). After that, pushes to `main` auto-deploy.
- Photos and map tiles have **never been seen rendering**: the build sandbox
  blocked Wikipedia, Wikimedia, CARTO, and the rate APIs. The code paths are
  tested with mocked fetches only. First job after deploy: open the live URL
  and check photos, map tiles, and `/api/rate`.

## Screens

| Route | What |
|---|---|
| `/` | Hero (SVG illustration under a live Parliament photo) with countdown, quick actions, hotel card, date strip, numbered timeline of stops with walk/taxi legs. Edit mode (reorder, retime, rename, move day, delete, add). Share day to WhatsApp. |
| `/map` | Leaflet + CARTO tiles. Filters: each day (numbered pins + dashed route), all days, kosher, ideas. Geolocation button. |
| `/explore` | Ideas + kosher places as photo cards; search and category filters; add to any day. |
| `/money` | HUF ⇄ ILS converter. Live rate from `/api/rate`, cached in settings; fallback 0.0096 ILS/HUF (July 2026). |
| `/info` | Emergency numbers (`#sos` anchor, linked from the red header button), Bolt how-to, weather tiles, Christmas markets, kosher & Shabbat, bookings, settings. |
| `/esim` | Airalo guide: recommended plan, compatibility check, coupon codes, iPhone/Samsung steps, troubleshooting. |

## Architecture notes

- **State**: `src/lib/store.ts` — two tiny `useSyncExternalStore` stores over
  localStorage (`budapest-trip`, `budapest-settings`). Server snapshot is the
  seed, so there are no hydration mismatches. Each phone keeps its own copy;
  there is no sync between the parents' phones.
- **Seed versioning**: saved plans are discarded when `TRIP_VERSION` in
  `src/lib/trip.ts` changes. Bump it whenever seed stops change, or phones keep
  the old plan.
- **Stops are always sorted by time.** "Move up/down" swaps times with the
  neighbour.
- **Legs** (`Stop.leg`, `Day.end`) carry `from` (the place id they start at).
  If the previous stop is no longer that place (user reordered), the UI shows a
  haversine estimate instead, marked "(הערכה)". Each day's first leg is
  measured from the hotel. Transport-category places (airport) get no leg and
  no map pin.
- **Photos**: `/api/photo?wiki=…&lang=…&commons=…&google=…&w=500|960` returns a
  302 to the image (edge-cached a week) or 404. Order: Google Places (only if
  `GOOGLE_PLACES_API_KEY` is set) → Wikipedia lead image → Wikimedia Commons
  search, accepted only if the file name contains every distinctive word of
  the query (a wrong photo is worse than none). Wikimedia only serves fixed
  thumbnail widths, so widths snap to 330/500/960/1280. On 404 the `<Photo>`
  component shows a category-coloured gradient tile with an icon.
- **Fonts**: Assistant is a local variable font (`src/app/fonts/`), because
  `next/font/google` can't download in sandboxes.
- **Icons**: `public/icon.svg` is the source; `node scripts/generate-icons.mjs`
  renders the PNGs.

## Data confidence

Researched via web search snippets only (no page fetches were possible), in
October 2026:

- **Places in the plan**: from the PDF, cross-checked. Coordinates are
  estimates; restaurants may be 50–200 m off. Navigation buttons search by
  address, so this mostly matters for map pins.
- **Kosher** (`KOSHER_PLACES`): Carmel, Hanna and Tel Aviv Café are confirmed
  operating. Kosher Deli, Brooklyn Bagel and Kings are medium/low confidence
  and labelled "check before". Shabbat meals need advance booking and
  prepayment by Fri 14:00. The trip's Fri dinner and Sat lunch stops carry
  kosher alternatives in `alts`.
- **Closed**: Gellért Baths are closed until ~2028 and deliberately excluded.
- **Emergency numbers** (`src/lib/emergency.ts`): only high/medium-confidence
  numbers. Hungary 112/104/107/105, the Israeli MFA situation room and the
  embassy are from official pages. Insurer and card numbers had conflicting
  sources; the page tells them to verify against their policy and card.
- **Airalo**: recommended Hungary "Szia!" 3GB/7 days ≈ €7.50. Coupons shown:
  `NEWTOAIRALO15` (15%, new users, coupon-site reports late Oct 2026, not
  confirmed by Airalo) and the official $3 referral. Other codes were too
  weakly sourced and left out.
- **Christmas 2026 dates** (light tram, City Park rink, Óbuda market) were not
  yet published; copy says "check".

## Open items

1. **Deploy** on Vercel (Hen does it; see Status).
2. **Verify on the live site**: photos per place (fix any wrong `photo.wiki`
   titles in `places.ts` / `ideas.ts`), map tiles, rate API, Bolt-address copy,
   and geolocation on a real phone.
3. **TikTok playlist**: Hen shared `https://vt.tiktok.com/ZS9yh884nSfda-l2jX9/`
   with Budapest recommendations to add to Ideas. It couldn't be opened from
   the sandbox (tiktok.com blocked, short link not indexed). Ask Hen for
   screenshots or place names, or open it from an environment with access, then
   add entries to `src/lib/ideas.ts` (and a `why` mentioning the TikTok).
4. **Optional restaurant photos**: add `GOOGLE_PLACES_API_KEY` (Places API
   (New)) in Vercel env vars; no code change needed.
5. **Nice to have**: sharing an edited plan between both parents' phones
   (would need a backend, e.g. Vercel KV, or a share-link encoding of the
   trip); `Trip.customPlaces` exists in the type but has no UI yet.

## Gotchas

- Mixed Hebrew/Latin text: wrap Latin runs (addresses, codes, prices) in
  `.latin` or `<bdi dir="ltr">`. Check with a screenshot; check glyph order
  with a DOM range measurement if unsure (the Assistant font's `*` is easy to
  misread).
- `eslint-config-next` 16 includes the React Compiler rules: no reassigning
  variables after render, no `"` in JSX text (use „ ”).
- Running `pnpm build` while `pnpm dev` is up corrupts the dev server's
  `.next`; restart dev with `rm -rf .next` afterwards.
- Day selection is remembered per date (`settings.dayPick`); during the trip
  the app opens on today's day.
