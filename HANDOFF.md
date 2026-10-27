# Handoff: Budapest trip app

State as of 2026-10-27. `AGENTS.md` and `agent_docs/` cover conventions and
architecture; this file is only "where we are and what's next".

## How Hen works

Short messages, expects things done end to end: commit and push to `main`,
then a brief report. Be honest about anything unverified. Hen asked for
Emil Kowalski–style polish and the Hen Helper look (monochrome; Hen disliked
the earlier red/navy/gold styling), and for the app to feel less overwhelming.

## Status

- Live at https://budapest-opal.vercel.app (Vercel project `budapest`, linked
  to `Hezi777/Budapest`; pushes to `main` auto-deploy).
- Verified on a real network: photos, OpenStreetMap tiles, `/api/rate`.
- Done this session: map tile fix (CARTO needs a key now), Hen Helper
  redesign, motion polish, sheet drag-to-dismiss, "next up" card during the
  trip, Wanderlog-style "מסלול" links between stops, first-visit welcome for
  Edna and Benny, calmer screens from a UX audit (compact ideas list,
  collapsible emergency groups, Info jump chips), research-backed tips (EES,
  contactless metro, service charge, pay in forints), wrong photos replaced.

## Open items

1. **Restaurant photos**: several restaurants and the hotel show icon tiles.
   Adding `GOOGLE_PLACES_API_KEY` (Places API (New)) in Vercel env vars fills
   them; no code change. Needs a Google Cloud project with billing, which is
   Hen's call.
2. **TikTok collection** "Budapest" (31 videos, `@hen_zrihen`, short link
   `https://vt.tiktok.com/ZS9yh884nSfda-l2jX9/`): the web view hides the
   videos behind an app wall. Needs Hen's logged-in browser (Claude in Chrome)
   or screenshots/place names, then entries in `src/lib/ideas.ts` with a `why`
   mentioning the TikTok.
3. **Plan content to confirm with the parents** (client-facing):
   - Day 1 has the hotel at 11:15 after a 10:00 landing; EES passport queues
     may make that tight.
   - Shabbat days lean on taxis and malls; a walking-distance alternative may
     suit them better.
   - Sunday: no flight time in the app; left-luggage fallback if the hotel
     can't hold bags.
4. **Ideas from research, not built**: packing checklist, documents wallet
   (tickets, insurance), phrase card, offline support (no service worker yet).
5. **Sharing an edited plan** between both phones needs a backend (or a
   share-link encoding of the trip). `Trip.customPlaces` has no UI yet.
6. Geolocation and the Bolt-address copy still need a check on a real phone.
