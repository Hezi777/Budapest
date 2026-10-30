# Budapest trip

A mobile web app for Edna and Benny, a couple (50s–60s, not technical),, on
a Budapest trip, Thu 26 – Sun 29 Nov 2026: the day-by-day plan, a map, ideas
(with kosher places; they keep kosher; Shabbat falls in the trip but they don't keep it strictly, so taxis and shops are fine), a
forint ⇄ shekel converter, emergency numbers and an eSIM guide. Hebrew, RTL.
Live at https://budapest-opal.vercel.app.

# This is NOT the Next.js you know

Next.js 16 / React 19 have breaking changes. Read the relevant guide in
`node_modules/next/dist/docs/` before writing Next.js code.

## Where things live

- `src/lib/trip.ts` — the four days (seed plan). `places.ts` — places in the
  plan and the kosher list. `ideas.ts` — extra places. `emergency.ts` — phones.
- `src/lib/store.ts` — the plan and settings, in localStorage, per phone.
- `src/app/api/photo` — real photo per place. `src/app/api/rate` — HUF → ILS.
- `src/app/globals.css` — all styles; tokens in `:root`.

## How to work

- pnpm, not npm. `pnpm dev`; `pnpm lint` and `pnpm build` before calling
  anything done. Don't run `build` while `dev` is up (it corrupts `.next`).
- Check UI changes with a screenshot at 390×844 before calling them done.
- Commit and push to `main` (no PR flow). Every push deploys to Vercel.
- Bump `TRIP_VERSION` in `src/lib/trip.ts` when seed stops change, or phones
  keep the old plan.
- Facts (hours, prices, phone numbers, coupon codes) must be sourced; say
  what's unverified instead of presenting it as fact.

## Rules

- User-facing strings are Hebrew; code, comments and commits are English.
- Layout is direction-agnostic: `inset-inline-*`, `margin-inline-*`,
  `padding-inline-*`, never left/right.
- Design is Hen Helper: white canvas, hairline-bordered cards, black ink for
  primary actions and selected states; colour only for meaning. Big tap
  targets (48px+), plain words, one obvious action per card.

## Read before starting

- `agent_docs/architecture.md` — state, legs, photos, fonts, icons, gotchas.
- `agent_docs/design.md` — tokens, motion, RTL and mixed-script text.
- `agent_docs/data.md` — how confident each piece of trip data is.
- `HANDOFF.md` — current status and open items.
