import { NextResponse } from "next/server";

/**
 * Live world gold price (USD per troy ounce), fetched server-side on Vercel.
 *
 * IMPORTANT: this never fabricates a value. Each source is validated and the
 * price must land in a sane gold range; if every source fails the route returns
 * ok:false and the client keeps the user's last (manual) number.
 *
 * Sources are tried in order. Parsing is shape-tolerant: we look at a few known
 * field paths, then fall back to scanning the JSON for a single number in the
 * plausible XAU/oz range — so a minor upstream shape change doesn't break us.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ok = { ok: true; price: number; source: string; updatedAt: string };
type Err = { ok: false; error: string; tried: string[] };

// A gold ounce in USD has lived roughly in [800, 20000] for decades; use a wide
// band purely as a sanity gate against parsing the wrong field.
const MIN = 800;
const MAX = 20000;
const sane = (n: unknown): n is number =>
  typeof n === "number" && isFinite(n) && n >= MIN && n <= MAX;

/** Deep-scan an arbitrary JSON value for the first number in gold's range. */
function scanForPrice(v: unknown, depth = 0): number | null {
  if (depth > 6) return null;
  if (sane(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[, ]/g, ""));
    if (sane(n)) return n;
  }
  if (Array.isArray(v)) {
    for (const x of v) {
      const r = scanForPrice(x, depth + 1);
      if (r !== null) return r;
    }
  } else if (v && typeof v === "object") {
    for (const x of Object.values(v as Record<string, unknown>)) {
      const r = scanForPrice(x, depth + 1);
      if (r !== null) return r;
    }
  }
  return null;
}

interface Source {
  name: string;
  url: string;
  headers?: Record<string, string>;
  // pull the most likely field first; null → fall back to deep scan
  pick: (j: any) => unknown;
  stamp?: (j: any) => string;
}

const SOURCES: Source[] = [
  {
    name: "gold-api.com",
    url: "https://api.gold-api.com/price/XAU",
    pick: (j) => j?.price,
    stamp: (j) => String(j?.updatedAt ?? j?.updatedAtReadable ?? ""),
  },
  {
    name: "goldprice.org",
    url: "https://data-asg.goldprice.org/dbXRates/USD",
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    pick: (j) => j?.items?.[0]?.xauPrice,
    stamp: (j) => String(j?.date ?? ""),
  },
  {
    name: "metals.live",
    url: "https://api.metals.live/v1/spot/gold",
    pick: (j) => (Array.isArray(j) ? j?.[0]?.price ?? j?.[0] : j?.price),
  },
];

async function tryOne(s: Source): Promise<Ok | null> {
  try {
    const r = await fetch(s.url, {
      cache: "no-store",
      headers: s.headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    let price = s.pick(j);
    if (!sane(price)) price = scanForPrice(j);
    if (!sane(price)) return null;
    return {
      ok: true,
      price,
      source: s.name,
      updatedAt: s.stamp ? s.stamp(j) : "",
    };
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse<Ok | Err>> {
  const tried: string[] = [];
  for (const s of SOURCES) {
    tried.push(s.name);
    const res = await tryOne(s);
    if (res) return NextResponse.json(res);
  }
  return NextResponse.json(
    { ok: false, error: "هیچ‌یک از منابع قیمت در دسترس نبودند", tried },
    { status: 502 },
  );
}
