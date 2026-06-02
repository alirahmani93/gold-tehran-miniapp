import { request } from 'undici';
import { logger } from '../utils/logger.js';
import { nowSec } from '../utils/time.js';
import type { RawQuote, Source } from './Source.js';

/**
 * World gold spot price (USD per troy ounce).
 *
 * Tries a list of public endpoints in order and returns on the first sane response.
 * "Sane" = a number landing in the wide gold band [800, 20000] USD/oz — enough to
 * reject obvious garbage (HTML, error envelopes, wrong field) without enforcing a
 * market-correct value.
 *
 * This source emits ONE quote per fetch: { asset: 'XAU', currency: 'USD', price, ts }.
 * The normalizer converts USD→IRT via the in-batch USDT/IRT rate from Bitpin. Since
 * each source is polled in isolation, the goldspot quote's IRT leg falls back to the
 * cached FX (within FX_FALLBACK_MAX_AGE_SEC) — which is fine: Bitpin polls in the
 * same beat and refreshes the cache before goldspot reads it.
 */

const MIN_USD_OZ = 800;
const MAX_USD_OZ = 20_000;
const TIMEOUT_MS = 8_000;

const sane = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= MIN_USD_OZ && n <= MAX_USD_OZ;

function scanForPrice(v: unknown, depth = 0): number | null {
  if (depth > 6) return null;
  if (sane(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[, ]/g, ''));
    if (sane(n)) return n;
  }
  if (Array.isArray(v)) {
    for (const x of v) {
      const r = scanForPrice(x, depth + 1);
      if (r !== null) return r;
    }
  } else if (v && typeof v === 'object') {
    for (const x of Object.values(v as Record<string, unknown>)) {
      const r = scanForPrice(x, depth + 1);
      if (r !== null) return r;
    }
  }
  return null;
}

interface Endpoint {
  name: string;
  url: string;
  headers?: Record<string, string>;
  /** First-try field; null → fall back to deep scan over the whole response. */
  pick: (j: any) => unknown;
}

const ENDPOINTS: Endpoint[] = [
  {
    name: 'gold-api.com',
    url: 'https://api.gold-api.com/price/XAU',
    pick: (j) => j?.price,
  },
  {
    name: 'goldprice.org',
    url: 'https://data-asg.goldprice.org/dbXRates/USD',
    headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' },
    pick: (j) => j?.items?.[0]?.xauPrice,
  },
  {
    name: 'metals.live',
    url: 'https://api.metals.live/v1/spot/gold',
    pick: (j) => (Array.isArray(j) ? (j?.[0]?.price ?? j?.[0]) : j?.price),
  },
];

async function tryOne(ep: Endpoint): Promise<number | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await request(ep.url, {
      method: 'GET',
      signal: ctrl.signal,
      headers: ep.headers ?? { accept: 'application/json', 'user-agent': 'price-service/0.1' },
    });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      logger.warn({ ep: ep.name, status: res.statusCode }, 'goldspot endpoint non-2xx');
      return null;
    }
    const j = (await res.body.json()) as unknown;
    const picked = ep.pick(j);
    if (sane(picked)) return picked;
    const scanned = scanForPrice(j);
    return scanned;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ ep: ep.name, err: msg }, 'goldspot endpoint failed');
    return null;
  } finally {
    clearTimeout(t);
  }
}

export class GoldSpotSource implements Source {
  readonly name = 'goldspot';

  async fetch(): Promise<RawQuote[]> {
    for (const ep of ENDPOINTS) {
      const price = await tryOne(ep);
      if (price !== null) {
        logger.info({ ep: ep.name, price }, 'goldspot ok');
        return [{ asset: 'XAU', price, currency: 'USD', volumeBase: null, ts: nowSec() }];
      }
    }
    throw new Error('all goldspot endpoints failed');
  }
}
