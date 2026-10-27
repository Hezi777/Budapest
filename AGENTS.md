# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Budapest trip

A mobile trip planner for a 4-day Budapest trip (26–29 Nov 2026), built for
parents in their 50s–60s. The UI is Hebrew and RTL.

## Where things live

- `src/lib/places.ts` — places in the plan, plus the kosher list.
- `src/lib/ideas.ts` — extra places for the Ideas tab.
- `src/lib/trip.ts` — the four days: stops, times, how to get between them.
- `src/lib/emergency.ts` — phone numbers on the Info page.
- `src/lib/store.ts` — the plan and settings, saved in localStorage.
- `src/app/api/photo` — resolves a real photo per place (Google Places if a
  key is set, else Wikipedia, else a matching Wikimedia Commons file).
- `src/app/api/rate` — live HUF → ILS rate.

Bump `TRIP_VERSION` in `src/lib/trip.ts` when the seed plan changes, so phones
with a saved plan pick up the new one.

## Conventions

- User-facing strings are Hebrew. Code, comments and commits are English.
- Plain CSS in `src/app/globals.css` using the tokens in `:root` (the Hen
  Helper design language). Reuse existing classes before inventing new ones.
- Layout must stay direction-agnostic: `inset-inline-*`, `margin-inline-*`,
  `padding-inline-*`, never left/right.
- The audience is not technical: big tap targets (48px+), plain words, one
  obvious action per card.
- Run `pnpm lint` and `pnpm build` before declaring work done.
