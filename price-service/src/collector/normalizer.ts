import type { RawQuote } from '../sources/Source.js';
import type { RawTick } from '../db/repo.js';
import { getFx, setFx } from '../cache/redis.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Normalize a batch of quotes (from one source, same poll) into RawTick rows with USD + IRT.
 *
 * Conventions:
 *  - We treat 1 USDT ≈ 1 USD for normalization. This is the industry default for monitoring;
 *    it introduces ~±1% error during stablecoin de-pegs, which is acceptable for our use case.
 *  - The USDT/IRT pair from the batch is our FX rate. If absent, we fall back to the last
 *    cached FX (within FX_FALLBACK_MAX_AGE_SEC), else we leave price_irt/price_usd as null.
 */
export async function normalize(source: string, quotes: RawQuote[]): Promise<RawTick[]> {
  let usdtIrt: number | null = null;

  const usdtIrtQuote = quotes.find((q) => q.asset === 'USDT' && q.currency === 'IRT');
  if (usdtIrtQuote) {
    usdtIrt = usdtIrtQuote.price;
    await setFx(usdtIrt, usdtIrtQuote.ts);
  } else {
    const cached = await getFx();
    if (cached && Date.now() / 1000 - cached.ts <= config.fxFallbackMaxAgeSec) {
      usdtIrt = cached.rate;
    } else {
      logger.warn({ source }, 'no USDT/IRT in batch and no fresh cached FX — IRT/USD fields will be null');
    }
  }

  return quotes.map((q) => toTick(source, q, usdtIrt));
}

function toTick(source: string, q: RawQuote, usdtIrt: number | null): RawTick {
  let price_usd: number | null = null;
  let price_irt: number | null = null;

  if (q.currency === 'USDT' || q.currency === 'USD') {
    price_usd = q.price;
    price_irt = usdtIrt !== null ? q.price * usdtIrt : null;
  } else if (q.currency === 'IRT') {
    price_irt = q.price;
    price_usd = usdtIrt !== null && usdtIrt > 0 ? q.price / usdtIrt : null;
  }

  return {
    ts: q.ts,
    asset: q.asset,
    source,
    price_native: q.price,
    currency: q.currency,
    price_usd,
    price_irt,
    volume: q.volumeBase ?? null,
  };
}
