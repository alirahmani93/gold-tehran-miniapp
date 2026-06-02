import {
  getDistinctAssetsInHourBucket,
  getHourlyForBucket,
  upsertCanonicalDaily,
  upsertCanonicalHourly,
} from '../db/repo.js';
import { getDb } from '../db/sqlite.js';
import { hourBucket, nowSec, dayKey } from '../utils/time.js';
import { logger } from '../utils/logger.js';
import { median, trimmedMean } from './stats.js';

/**
 * Compute cross-source canonical price for each asset in a given hour bucket.
 * Input value per source = hourly TWAP if present, else hourly mean.
 * Output = median + trimmed mean across sources, in USD and IRT.
 */
export function canonicalHour(bucketTs?: number): number {
  const targetBucket = bucketTs ?? hourBucket(nowSec()) - 3600;
  const assets = getDistinctAssetsInHourBucket(targetBucket);
  let written = 0;

  for (const asset of assets) {
    const perSource = getHourlyForBucket(targetBucket, asset);
    const usd = perSource
      .map((h) => h.twap_usd ?? h.mean_usd)
      .filter((v): v is number => v !== null && v > 0);
    const irt = perSource
      .map((h) => h.twap_irt ?? h.mean_irt)
      .filter((v): v is number => v !== null && v > 0);

    upsertCanonicalHourly({
      bucket_ts: targetBucket,
      asset,
      median_usd: median(usd),
      trimmed_mean_usd: trimmedMean(usd),
      median_irt: median(irt),
      trimmed_mean_irt: trimmedMean(irt),
      source_count: perSource.length,
    });
    written++;
  }

  logger.info({ bucket: new Date(targetBucket * 1000).toISOString(), assets: written }, 'canonical hourly');
  return written;
}

interface DailyRow {
  asset: string;
  source: string;
  mean_usd: number | null; twap_usd: number | null;
  mean_irt: number | null; twap_irt: number | null;
}

/** Same logic across the day, using per-source daily TWAP/mean. */
export function canonicalDay(day?: string): number {
  const targetDay = day ?? dayKey(nowSec() - 86_400);
  const rows = getDb()
    .prepare(`SELECT asset, source, mean_usd, twap_usd, mean_irt, twap_irt FROM prices_daily WHERE day = ?`)
    .all(targetDay) as DailyRow[];

  const byAsset = new Map<string, DailyRow[]>();
  for (const r of rows) {
    let arr = byAsset.get(r.asset);
    if (!arr) { arr = []; byAsset.set(r.asset, arr); }
    arr.push(r);
  }

  let written = 0;
  for (const [asset, list] of byAsset) {
    const usd = list
      .map((r) => r.twap_usd ?? r.mean_usd)
      .filter((v): v is number => v !== null && v > 0);
    const irt = list
      .map((r) => r.twap_irt ?? r.mean_irt)
      .filter((v): v is number => v !== null && v > 0);
    upsertCanonicalDaily({
      day: targetDay,
      asset,
      median_usd: median(usd),
      trimmed_mean_usd: trimmedMean(usd),
      median_irt: median(irt),
      trimmed_mean_irt: trimmedMean(irt),
      source_count: list.length,
    });
    written++;
  }

  logger.info({ day: targetDay, assets: written }, 'canonical daily');
  return written;
}
