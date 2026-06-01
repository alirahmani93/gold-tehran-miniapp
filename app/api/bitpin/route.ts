import { NextResponse } from "next/server";

/**
 * Live USDT and PAXG prices from Bitpin's public market list.
 *
 * Bitpin exposes no per-market detail or ticker endpoint — only the full
 * markets list (~1100 entries). We filter by stable numeric ids:
 *   - USDT_IRT  id=5    (USDT in Toman)
 *   - PAXG_IRT  id=511  (PAXG, gold-backed, in Toman)
 *   - PAXG_USDT id=512  (PAXG in USDT)
 *
 * Never fabricates a value — each leg is sanity-checked against a wide band,
 * and the route returns ok:false if every leg fails.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Leg = { price: number; change: number | null };
type Ok = {
  ok: true;
  usdtIrt: Leg;
  paxgIrt: Leg;
  paxgUsdt: Leg;
  source: string;
  updatedAt: string;
};
type Err = { ok: false; error: string };

const URL = "https://api.bitpin.ir/v1/mkt/markets/";

const IDS = { usdtIrt: 5, paxgIrt: 511, paxgUsdt: 512 } as const;

// Wide sanity bands — we just want to reject obvious garbage, not enforce
// market-correct values.
const BANDS: Record<keyof typeof IDS, [number, number]> = {
  usdtIrt: [10_000, 10_000_000], // Toman per USDT
  paxgIrt: [10_000_000, 10_000_000_000], // Toman per PAXG (≈ one ounce of gold)
  paxgUsdt: [500, 50_000], // USDT per PAXG
};

const num = (v: unknown): number | null => {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (isFinite(n)) return n;
  }
  return null;
};

function pickLeg(
  market: any,
  band: [number, number],
): Leg | null {
  // Prefer order_book_info.price (live), fall back to internal then top-level.
  const candidates = [
    market?.order_book_info?.price,
    market?.internal_price_info?.price,
    market?.price,
  ];
  for (const c of candidates) {
    const n = num(c);
    if (n !== null && n >= band[0] && n <= band[1]) {
      const change = num(market?.order_book_info?.change) ?? num(market?.price_info?.change);
      return { price: n, change };
    }
  }
  return null;
}

export async function GET(): Promise<NextResponse<Ok | Err>> {
  let json: any;
  try {
    const r = await fetch(URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `Bitpin HTTP ${r.status}` },
        { status: 502 },
      );
    }
    json = await r.json();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Bitpin در دسترس نیست" },
      { status: 502 },
    );
  }

  const results: any[] = Array.isArray(json?.results) ? json.results : [];
  const byId = new Map<number, any>(results.map((m) => [m.id, m]));

  const usdtIrt = pickLeg(byId.get(IDS.usdtIrt), BANDS.usdtIrt);
  const paxgIrt = pickLeg(byId.get(IDS.paxgIrt), BANDS.paxgIrt);
  const paxgUsdt = pickLeg(byId.get(IDS.paxgUsdt), BANDS.paxgUsdt);

  if (!usdtIrt || !paxgIrt || !paxgUsdt) {
    return NextResponse.json(
      { ok: false, error: "داده‌ی Bitpin ناقص بود" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    usdtIrt,
    paxgIrt,
    paxgUsdt,
    source: "bitpin.ir",
    updatedAt: new Date().toISOString(),
  });
}
