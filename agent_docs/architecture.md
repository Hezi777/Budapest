# Architecture

## State

`src/lib/store.ts` holds two small `useSyncExternalStore` stores over
localStorage: `budapest-trip` and `budapest-settings`. The server snapshot is
the seed, so there are no hydration mismatches. Anything that must differ per
phone (the welcome screen, today's date, the current time) renders only after
hydration (see `useToday` / `useNow` in `src/components/plan-view.tsx` and
`src/components/welcome.tsx`). Each phone keeps its own copy; nothing syncs
between the two parents' phones.

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

Leaflet with OpenStreetMap tiles (`src/components/map-canvas.tsx`). CARTO
tiles now need an API key; don't switch back without one.

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
