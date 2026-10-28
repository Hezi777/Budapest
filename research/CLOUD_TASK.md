# Cloud task: TikTok places and missing photos

Everything that needed Hen's network or TikTok login was downloaded on Hen's
Mac and committed here, so this work needs no internet beyond web search.
Read `AGENTS.md`, `agent_docs/` and `HANDOFF.md` first.

Read the material from this `research/materials` branch, but make the code
changes on `main` and push to `main` (the repo has no PR flow; pushes deploy).
Never commit anything under `research/` to `main`.

## 1. Hen's TikTok collection → Ideas

Material in `research/tiktok/`:

- `posts.json` — the 29 posts Hen saved: `n`, `url`, `author`, `desc`
  (caption), `stickers` (on-screen text), `dump` (text summary),
  `slide_count`.
- `slides/NN-MM.jpg` — every slide of the 18 photo posts (`NN` = post `n`,
  `MM` = slide). Most place names are written ON these images, in Hebrew or
  English. Look at every one.
- `frames/NN-MM.jpg` — a frame every 2 seconds from the 11 video posts.
- `subs/` — subtitle files yt-dlp found for the videos (may be few).

Steps:

1. Read every slide and frame (plus captions and subtitles) and list each
   concrete place (restaurant, café, bakery, shop, sight, market,
   experience), with the post numbers that recommend it.
2. Drop vague mentions, places outside Budapest (a clearly recommended day
   trip is fine), and anything already in `src/lib/ideas.ts` or
   `src/lib/places.ts` (match by local name).
3. Verify each place with web search: still operating in late 2026, address,
   approximate lat/lng, typical hours, price level, kosher status. Most
   aren't kosher: tag restaurants and cafés `nonKosher`, and mention dairy
   options where relevant. Write „כדאי לבדוק לפני” for anything unverified.
   Never invent facts.
4. Add them as one block at the end of `IDEAS`, before its closing `];`,
   headed `/* ---------- From Hen's TikTok collection ---------- */`. Copy the
   exact shape of existing entries. Ids are kebab-case with a `tt-` prefix.
   Each `why` says it came from Hen's TikTok („מהטיקטוקים ששמרת: …”) and
   why people recommend it.
5. Photo for each new place: if a slide or frame clearly shows the venue,
   crop or resize it to `public/places/<id>.webp` (sharp is in
   node_modules; max 960px wide, quality ~78, under ~120KB) and set
   `photo: { file: "<id>.webp" }`. Add a line per file to
   `public/places/SOURCES.md` (`<file>` — TikTok post URL from posts.json).
   No good image means no photo; never a wrong one.

## 2. Photos for existing places that have none

Material in `research/photos/<place-id>/`: candidate images for every place
whose photo currently fails on the live site, with `sources.json` (place
name, address, and each candidate's source URL). Candidates come from the
venue's website (`site.jpg`), its Google Maps listing (`maps1-3.jpg`),
Wikimedia Commons (`commons1-2.jpg`), and an earlier unverified download
(`earlier.jpg`, source unknown).

Steps:

1. For each place, look at the candidates and pick one that clearly shows
   THAT venue (exterior, interior or a signature dish). Maps results can be
   a neighbouring business or a menu; Commons results can be the wrong
   building. If none is right, skip the place.
2. Convert the pick to `public/places/<place-id>.webp` (same size rules) and
   set that place's `photo` to `{ file: "<place-id>.webp" }`. Only change
   `photo` fields; don't touch other fields or order.
3. Add a line per file to `public/places/SOURCES.md` with the source URL from
   `sources.json`. Don't use `earlier.jpg` unless you can tell its source.

## Done means

- `pnpm lint` and `pnpm build` pass.
- Screenshots at 390×844 (Playwright, isMobile) of the plan for all 4 days,
  /explore, and a few new TikTok entries look right: correct photos, nothing
  stretched, Hebrew reads right to left.
- Pushed to `main`, with commit messages listing the new places and the
  photos added.
- `HANDOFF.md` open items 1 and 2 updated.
- Final report: new places (name, category, TikTok author), places skipped
  and why, photos added or skipped.
