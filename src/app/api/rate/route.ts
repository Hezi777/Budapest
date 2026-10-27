/**
 * Live HUF → ILS rate. Frankfurter (European Central Bank data) first, then
 * open.er-api.com. Cached at the edge for a few hours.
 */

type Rate = { rate: number; date: string; source: string };

async function frankfurter(): Promise<Rate | undefined> {
  const res = await fetch("https://api.frankfurter.dev/v1/latest?base=HUF&symbols=ILS", {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return undefined;
  const data = (await res.json()) as { date?: string; rates?: { ILS?: number } };
  const rate = data.rates?.ILS;
  return rate && data.date ? { rate, date: data.date, source: "ECB" } : undefined;
}

async function erApi(): Promise<Rate | undefined> {
  const res = await fetch("https://open.er-api.com/v6/latest/HUF", {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return undefined;
  const data = (await res.json()) as {
    time_last_update_utc?: string;
    rates?: { ILS?: number };
  };
  const rate = data.rates?.ILS;
  if (!rate) return undefined;
  const date = data.time_last_update_utc
    ? new Date(data.time_last_update_utc).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return { rate, date, source: "ExchangeRate-API" };
}

export async function GET() {
  for (const source of [frankfurter, erApi]) {
    try {
      const rate = await source();
      if (rate) {
        return Response.json(rate, {
          headers: {
            "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
          },
        });
      }
    } catch {
      // Try the next source.
    }
  }
  return Response.json({ error: "unavailable" }, { status: 503 });
}
