# Architecture

## State

`src/lib/store.ts` holds two small `useSyncExternalStore` stores over
localStorage: `budapest-trip` and `budapest-settings`. The server snapshot is
the seed, so there are no hydration mismatches. Anything that must differ per
phone (the welcome screen, today's date, the current time) renders only after
hydration (see `useToday` / `useNow` in `src/components/plan-view.tsx` and
`src/components/welcome.tsx`). Each phone keeps its own copy; nothing syncs
between Edna's and Benny's phones.

Saved plans are discarded when `TRIP_VERSION` (`src/lib/trip.ts`) changes.

## Plan and legs

- Stops are always sorted by time. "Move up/down" swaps times with the
  neighbour (`moveStop` in `store.ts`).
- Legs (`Stop.leg`, `Day.end`) carry `from`, the place id they start at. If
  the previous stop is no longer that place (the user reordered), the UI shows
  a haversine estimate marked "(הערכה)" (`resolveLeg` in `plan-view.tsx`,
  `estimateLeg` in `src/lib/geo.ts`). Each day's first leg starts at the hotel.
  Transport places (airport) get no leg and no map pin.
- Every leg has a "מסלול" link: Google Maps directions from the previous stop
  to this one (`directionsUrl(to, mode, from)`).
- During the trip, `NextUp` shows the first unticked stop of today.

## Tabs and swiping

A sideways swipe on `<main>` moves between the bottom-nav tabs (`useTabSwipe`
in `src/components/app-shell.tsx`). RTL: a swipe to the right goes to the next
tab. Swipes that start on the map, a sheet, a field or anything that scrolls
sideways are ignored; add `data-no-swipe` to opt out anything else.

App store buttons go through `StoreLinks` / `STORE_URL` in
`src/components/ui.tsx`, which picks the App Store or Google Play from the
phone's user agent (both buttons when it can't tell).

## Photos

`/api/photo?wiki=…&lang=…&commons=…&google=…&w=500|960|1280` returns a 302 to
an image (edge-cached a week) or 404. Order: Google Places (only if
`GOOGLE_PLACES_API_KEY` is set in Vercel) → Wikipedia lead image → Wikimedia
Commons search, kept only if the file name contains every distinctive word of
the query (a wrong photo is worse than none). Wikimedia serves fixed widths,
so widths snap to 330/500/960/1280. A miss caused by an upstream error is
`no-store`, so a throttled burst doesn't blank photos for a day. On 404,
`<Photo>` shows a neutral icon tile (or nothing, with `hideIfMissing`).

When a Wikipedia lead image is a logo or wrong, use a `commons` query instead
(see the airport and House of Terror entries).

## Map

MapLibre GL JS with OpenFreeMap's "liberty" vector style
(`src/components/map-canvas.tsx`; free, no key; the credit comes from the
tile source and shows as MapLibre's compact control). If the style can't load
(offline, blocked) the map falls back to a plain background and pins, route
and GPS keep working. Flat and north-up: rotation and pitch are off. Pins are
HTML markers, round badges (numbers, or a Lucide glyph rendered to HTML for
hotel, kosher, idea); the day's route and the GPS accuracy circle are GeoJSON
layers, re-added after every style load. The map element carries
`data-no-swipe` so dragging it doesn't switch tabs.
"איפה אני?" starts `watchPosition`: a live blue dot that the map follows until
the user drags; the GPS stops when leaving the page. If location is denied, a
sheet explains how to allow it. While a place card is open the locate and zoom
controls hide (`data-card-open`); tapping the bare map closes the card.

## Sheets and toasts

`Sheet` (`src/components/ui.tsx`) portals to `<body>` (z-index 1100) so no
page's stacking context, the map's above all, can paint over it. Toasts sit at
1200, stay at least 4s (longer for long text) and take an optional action:
`toast("נמחק", { label: "ביטול", onClick })`. Info and money use the shared
`Topic` row (`src/components/topic.tsx`), a `<details>` that `HashOpen` opens
from the URL hash (`/info#packing`). The packing list is saved in settings
(`packed`).

## Reordering

In edit mode each stop has one row of buttons (למעלה, למטה, עריכה) and a grip
handle for dragging (`useStopDrag` in
`src/components/plan-view.tsx`). Dropping calls `moveStopTo` in the store:
stops change slots, every slot keeps its time, so the day stays sorted.

## Home-screen app

`src/app/manifest.ts` (standalone, shortcuts, a maskable icon),
`public/sw.js` (offline: pages network-first, build assets and photos
cache-first; registered in production only) and `InstallCard`
(`src/components/install-card.tsx`), which explains "add to home screen" per
platform and hides itself once opened from the home screen. Icons come from
`public/icon.svg` via `node scripts/generate-icons.mjs`; iOS and the maskable
icon get a square, full-bleed tile. Push notifications need a server and VAPID
keys; not built.

## Merged places

Ideas that duplicated another entry were merged (`MERGED` in
`src/lib/catalog.ts`); old ids still resolve, since phones may have them in a
saved plan.

## Fonts and icons

Assistant is a local variable font in `src/app/fonts/`. `public/icon.svg` is
the icon source; `node scripts/generate-icons.mjs` renders the PNGs.

## Gotchas

- `eslint-config-next` 16 includes the React Compiler rules: no reassigning
  variables after render, no `"` in JSX text (use „ ”).
- Running `pnpm build` while `pnpm dev` is up corrupts the dev server's
  `.next`; restart dev with `rm -rf .next`.
- When restarting `pnpm start`, kill the old process by port
  (`lsof -ti :PORT | xargs kill`): a stale server keeps serving HTML that
  points at deleted CSS chunks, which looks like broken styles.
- Day selection is remembered per date (`settings.dayPick`); during the trip
  the app opens on today's day.
