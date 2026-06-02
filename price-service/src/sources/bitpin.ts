import { request } from 'undici';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { nowSec } from '../utils/time.js';
import type { RawQuote, Source } from './Source.js';
import { BITPIN_PAIRS } from './registry.js';

interface BitpinMarket {
  id: number;
  currency1: { code: string; tradable: boolean };
  currency2: { code: string };
  tradable: boolean;
  suspended: boolean;
  price?: string | null;
  price_info?: { price?: string | null; created_at?: number | null } | null;
  order_book_info?: {
    price?: string | null;
    amount?: string | null;  // base-unit 24h volume
    value?: string | null;   // quote-unit 24h volume
    time?: string | null;
  } | null;
}

interface BitpinMarketsResponse {
  count: number;
  next: string | null;
  results: BitpinMarket[];
}

const PATH = '/v1/mkt/markets/';

const parseNum = (v: string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export class BitpinSource implements Source {
  readonly name = 'bitpin';

  async fetch(): Promise<RawQuote[]> {
    const url = `${config.bitpinBaseUrl.replace(/\/$/, '')}${PATH}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), config.bitpinTimeoutMs);
    try {
      const res = await request(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: { accept: 'application/json', 'user-agent': 'price-service/0.1' },
      });
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(`bitpin HTTP ${res.statusCode}`);
      }
      const body = (await res.body.json()) as BitpinMarketsResponse;
      return this.extract(body);
    } finally {
      clearTimeout(t);
    }
  }

  private extract(body: BitpinMarketsResponse): RawQuote[] {
    const ts = nowSec();
    const out: RawQuote[] = [];
    for (const m of body.results) {
      if (!m.tradable || m.suspended) continue;
      const key = `${m.currency1.code}_${m.currency2.code}`;
      const map = BITPIN_PAIRS[key];
      if (!map) continue;

      const price =
        parseNum(m.order_book_info?.price ?? null) ??
        parseNum(m.price_info?.price ?? null) ??
        parseNum(m.price ?? null);
      if (price === null || price <= 0) {
        logger.warn({ market: key }, 'bitpin: skipping market with no price');
        continue;
      }
      const volumeBase = parseNum(m.order_book_info?.amount ?? null);
      out.push({ asset: map.asset, price, currency: map.currency, volumeBase, ts });
    }
    return out;
  }
}
