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
- Done this session: interactive eSIM walkthrough with real screenshots, map tile fix (CARTO needs a key now), Hen Helper
  redesign, motion polish, sheet drag-to-dismiss, "next up" card during the
  trip, Wanderlog-style "מסלול" links between stops, first-visit welcome for
  Edna and Benny, calmer screens from a UX audit (compact ideas list,
  collapsible emergency groups, Info jump chips), research-backed tips (EES,
  contactless metro, service charge, pay in forints), wrong photos replaced.

## Open items

1. **Restaurant photos (no API, Hen's choice)**: fetch real photos manually
   (venue website, Google Maps listing, Commons) into `public/places/<id>.webp`
   and add a `file` option to `PhotoSource`/`photoUrl`. An agent started this
   and was stopped at the usage limit; its partial downloads are uncommitted in
   the worktree `.claude/worktrees/agent-ab7be357f5fbba0b2` (`public/places/`).
2. **TikTok collection**: Hen's account is private, so the collection only
   loads while signed in (Hen is signed in to TikTok in the desktop app's
   built-in browser). All 29 posts (captions, on-screen text, 212 slideshow
   image URLs, video/subtitle URLs) are saved in `.tiktok-collection.json` at
   the repo root (git-excluded; slide URLs expire ~29 Oct 2026). Next: read the
   slides (place names are written on them), dedupe against `ideas.ts` and
   `places.ts`, verify each place, and add to `src/lib/ideas.ts` with a `why`
   saying it came from Hen's TikTok.
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
