# Handoff: Budapest trip app

State as of 2026-10-30. `AGENTS.md` and `agent_docs/` cover conventions and
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

1. **Place photos**: done 2026-10-28. 32 places that had no working photo now
   use a hand-checked file in `public/places/` (sources in `SOURCES.md` there).
   Still without a photo: Jamie's (no candidate clearly the Budapest branch),
   King's (only other hotels), Szentendre (Commons showed a tram museum).
2. **TikTok collection**: done 2026-10-28. 24 places from Hen's saved TikToks
   are in `src/lib/ideas.ts` (`tt-` ids, block at the end of `IDEAS`), 17 with
   a photo cropped from the TikTok. Coordinates of `tt-` places are estimates
   (geocoders were blocked in the cloud session); a few facts are marked
   „כדאי לבדוק לפני” (Tokio identity, Slow Moe's location and kashrut,
   Karaván in winter, Museum of Illusions reopening).
3. **Plan content to confirm with Edna and Benny** (client-facing):
   - Day 1 has the hotel at 11:15 after a 10:00 landing; EES passport queues
     may make that tight.
   - Shabbat days lean on taxis and malls; a walking-distance alternative may
     suit them better.
   - Sunday: no flight time in the app; left-luggage fallback if the hotel
     can't hold bags.
4. **Ideas from research, not built**: packing checklist, documents wallet
   (tickets, insurance), phrase card. Offline support is in (service worker,
   2026-10-30). Push notifications (e.g. "next stop in 15 minutes") need a
   push server and VAPID keys in Vercel; not built.
5. **Sharing an edited plan** between both phones needs a backend (or a
   share-link encoding of the trip). `Trip.customPlaces` has no UI yet.
6. Geolocation (now live tracking on the map), drag-to-reorder and the Bolt-address
   copy still need a check on a real phone.
7. **Logo**: the icon is after the Budapest flag (white field, red and green
   triangles) with our Parliament mark. The real coat of arms couldn't be
   downloaded from the cloud session (Wikimedia blocked); its use is also
   legally restricted in Hungary.
