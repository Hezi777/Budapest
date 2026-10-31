/**
 * The shared plan, so Edna's and Benny's phones see the same trip.
 *
 * Stored in Upstash Redis (Vercel Marketplace, free tier) under two keys: the
 * plan and its revision. A save names the revision it started from; if the
 * other phone saved in between, it gets a 409 with the latest plan and merges.
 * Without the Redis env vars the route answers 503 and every phone simply
 * keeps its own copy, as before.
 *
 * There is no login: anyone with the site can read and change the plan, so it
 * must never hold anything sensitive (the reservation sheet says so).
 */

export const dynamic = "force-dynamic";

const DOC = "budapest:trip";
const REV = "budapest:trip:rev";
/** A whole plan is ~30 KB; anything far bigger isn't ours. */
const MAX_BYTES = 300_000;

type Stored = { rev: number; trip: unknown; savedAt: string };

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

/** For local testing only (TRIP_SYNC_MEMORY=1): a store that lives in this process. */
const memory = process.env.TRIP_SYNC_MEMORY === "1" ? new Map<string, string>() : undefined;

async function redis(command: (string | number)[]): Promise<unknown> {
  if (memory) return memoryCommand(memory, command);
  const res = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result;
}

/** Save only if nobody saved since `base`: [1, newRev] or [0, currentRev]. */
const SAVE_IF_CURRENT = `
local rev = tonumber(redis.call('GET', KEYS[1]) or '0')
if rev ~= tonumber(ARGV[1]) then return {0, rev} end
redis.call('SET', KEYS[2], ARGV[2])
redis.call('SET', KEYS[1], rev + 1)
return {1, rev + 1}`;

function memoryCommand(store: Map<string, string>, [name, ...args]: (string | number)[]): unknown {
  if (name === "GET") return store.get(String(args[0])) ?? null;
  // EVAL SAVE_IF_CURRENT 2 REV DOC base doc
  const rev = Number(store.get(REV) ?? 0);
  if (rev !== Number(args[4])) return [0, rev];
  store.set(DOC, String(args[5]));
  store.set(REV, String(rev + 1));
  return [1, rev + 1];
}

const configured = () => !!memory || (!!url && !!token);

const noStore = { "Cache-Control": "no-store" };

async function current(): Promise<Stored | null> {
  const raw = await redis(["GET", DOC]);
  return typeof raw === "string" ? (JSON.parse(raw) as Stored) : null;
}

export async function GET() {
  if (!configured()) return Response.json({ error: "sync off" }, { status: 503, headers: noStore });
  try {
    const doc = await current();
    return Response.json(doc ?? { rev: 0, trip: null }, { headers: noStore });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502, headers: noStore });
  }
}

function looksLikeTrip(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const t = v as { version?: unknown; days?: unknown };
  return typeof t.version === "number" && Array.isArray(t.days);
}

export async function PUT(request: Request) {
  if (!configured()) return Response.json({ error: "sync off" }, { status: 503, headers: noStore });
  const text = await request.text();
  if (text.length > MAX_BYTES) return Response.json({ error: "too big" }, { status: 413, headers: noStore });
  let body: { baseRev?: unknown; trip?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "bad json" }, { status: 400, headers: noStore });
  }
  if (typeof body.baseRev !== "number" || !looksLikeTrip(body.trip)) {
    return Response.json({ error: "bad request" }, { status: 400, headers: noStore });
  }
  try {
    const savedAt = new Date().toISOString();
    const doc = (rev: number): string => JSON.stringify({ rev, trip: body.trip, savedAt });
    const [ok, rev] = (await redis(["EVAL", SAVE_IF_CURRENT, 2, REV, DOC, body.baseRev, doc(body.baseRev + 1)])) as [
      number,
      number,
    ];
    if (ok === 1) return Response.json({ rev, savedAt }, { headers: noStore });
    // The other phone saved first: send the latest so this one can merge.
    return Response.json((await current()) ?? { rev, trip: null }, { status: 409, headers: noStore });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502, headers: noStore });
  }
}
