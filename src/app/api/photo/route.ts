import type { NextRequest } from "next/server";

/**
 * Resolves a place photo and redirects to it, so pages can use a plain
 * <img src="/api/photo?wiki=…">. Sources, in order:
 *   1. Google Places — only when GOOGLE_PLACES_API_KEY is set.
 *   2. The lead image of a Wikipedia article.
 *   3. A Wikimedia Commons file search, kept only if the file name matches.
 * Results are cached at the edge for a week.
 */

const UA = "BudapestTripSite/1.0 (personal trip planner)";
/** Wikimedia only serves a fixed set of thumbnail widths. */
const WIKI_WIDTHS = [330, 500, 960, 1280];
const CACHE_HIT = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800";
const CACHE_MISS = "public, max-age=3600, s-maxage=86400";

function snapWidth(w: number): number {
  return WIKI_WIDTHS.find((s) => s >= w) ?? WIKI_WIDTHS[WIKI_WIDTHS.length - 1];
}

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, ...init?.headers },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return undefined;
  return res.json();
}

type WikiSummary = {
  thumbnail?: { source: string; width: number };
  originalimage?: { source: string; width: number };
};

async function fromWikipedia(title: string, lang: string, width: number) {
  const slug = encodeURIComponent(title.replace(/ /g, "_"));
  const data = (await getJson(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`,
  )) as WikiSummary | undefined;
  const original = data?.originalimage;
  const thumb = data?.thumbnail;
  if (!original && !thumb) return undefined;
  // Asking for a thumbnail wider than the original fails, so use the original.
  if (original && original.width <= width) return original.source;
  if (thumb && /\/\d+px-/.test(thumb.source)) {
    return thumb.source.replace(/\/\d+px-/, `/${width}px-`);
  }
  return original?.source ?? thumb?.source;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

type CommonsResult = {
  query?: {
    pages?: Record<
      string,
      { title: string; index: number; imageinfo?: { thumburl?: string; mime: string }[] }
    >;
  };
};

async function fromCommons(search: string, width: number) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "8",
    gsrsearch: `${search} filetype:bitmap`,
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: String(width),
    origin: "*",
  });
  const data = (await getJson(
    `https://commons.wikimedia.org/w/api.php?${params}`,
  )) as CommonsResult | undefined;
  const pages = Object.values(data?.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  // A wrong photo is worse than none: keep a file only if its name carries
  // every distinctive word of the search.
  const words = normalize(search)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && w !== "budapest");
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !/jpeg|png|webp/.test(info.mime)) continue;
    const name = normalize(page.title);
    if (words.every((w) => name.includes(w))) return info.thumburl;
  }
  return undefined;
}

type PlacesSearch = { places?: { photos?: { name: string }[] }[] };

async function fromGoogle(text: string, width: number, key: string) {
  const search = (await getJson("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.photos",
    },
    body: JSON.stringify({ textQuery: text, maxResultCount: 1 }),
  })) as PlacesSearch | undefined;
  const photo = search?.places?.[0]?.photos?.[0];
  if (!photo) return undefined;
  const media = (await getJson(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${width}&skipHttpRedirect=true&key=${key}`,
  )) as { photoUri?: string } | undefined;
  return media?.photoUri;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const width = snapWidth(Number(params.get("w")) || 500);
  const wiki = params.get("wiki");
  const lang = params.get("lang") ?? "en";
  const commons = params.get("commons");
  const google = params.get("google");
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!/^(en|hu|he)$/.test(lang)) {
    return new Response("Bad language", { status: 400 });
  }

  const attempts: (() => Promise<string | undefined>)[] = [];
  if (google && key) attempts.push(() => fromGoogle(google, width, key));
  if (wiki) attempts.push(() => fromWikipedia(wiki, lang, width));
  if (commons) attempts.push(() => fromCommons(commons, width));

  for (const attempt of attempts) {
    try {
      const url = await attempt();
      if (url) {
        return new Response(null, {
          status: 302,
          headers: { Location: url, "Cache-Control": CACHE_HIT },
        });
      }
    } catch {
      // Try the next source.
    }
  }
  return new Response("No photo", {
    status: 404,
    headers: { "Cache-Control": CACHE_MISS },
  });
}
