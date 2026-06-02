import {
  distinctAssetSourcePairsInRange,
  getRawInRange,
  upsertHourly,
} from '../db/repo.js';
import { hourBucket, nowSec } from '../utils/time.js';
import { logger } from '../utils/logger.js';
import { mean, twap, vwap } from './stats.js';

/**
 * Roll up `prices_raw` into one row per (asset, source) for the given hour bucket.
 * If `bucketTs` is omitted, rolls up the most recently completed hour.
 */
export function rollupHour(bucketTs?: number): number {
  const targetBucket = bucketTs ?? hourBucket(nowSec()) - 3600;
  const windowStart = targetBucket;
  const windowEnd = targetBucket + 3600;

  const pairs = distinctAssetSourcePairsInRange(windowStart, windowEnd);
  let written = 0;

  for (const { asset, source } of pairs) {
    const rows = getRawInRange(asset, source, windowStart, windowEnd);
    if (rows.length === 0) continue;

    const usdSamples = rows
      .filter((r) => r.price_usd !== null)
      .map((r) => ({ ts: r.ts, price: r.price_usd as number, volume: r.volume }));
    const irtSamples = rows
      .filter((r) => r.price_irt !== null)
      .map((r) => ({ ts: r.ts, price: r.price_irt as number, volume: r.volume }));

    const totalVolume = rows.reduce<number>((acc, r) => acc + (r.volume ?? 0), 0);

    upsertHourly({
      bucket_ts: targetBucket,
      asset,
      source,
      mean_usd: mean(usdSamples.map((s) => s.price)),
      twap_usd: twap(usdSamples.map((s) => ({ ts: s.ts, price: s.price })), windowStart, windowEnd),
      vwap_usd: vwap(usdSamples.map((s) => ({ price: s.price, volume: s.volume }))),
      mean_irt: mean(irtSamples.map((s) => s.price)),
      twap_irt: twap(irtSamples.map((s) => ({ ts: s.ts, price: s.price })), windowStart, windowEnd),
      vwap_irt: vwap(irtSamples.map((s) => ({ price: s.price, volume: s.volume }))),
      sample_count: rows.length,
      volume: totalVolume > 0 ? totalVolume : null,
    });
    written++;
  }

  logger.info({ bucket: new Date(targetBucket * 1000).toISOString(), written }, 'hourly rollup');
  return written;
}
