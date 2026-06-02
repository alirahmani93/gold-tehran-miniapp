import { getDb } from '../db/sqlite.js';
import { upsertDaily, type HourlyRow } from '../db/repo.js';
import { dayKey, dayStartSec, nowSec } from '../utils/time.js';
import { logger } from '../utils/logger.js';
import { mean } from './stats.js';

/**
 * Roll up `prices_hourly` into one row per (asset, source) per UTC day.
 * If `day` is omitted, rolls up the most recently completed day (UTC).
 *
 * Day-level mean = mean of hourly means.
 * Day-level TWAP = volume-of-time weighted mean (each hour weighted equally if no gaps,
 *   approximated as a simple mean of hourly TWAPs).
 * Day-level VWAP = sum(hour.vwap * hour.volume) / sum(hour.volume).
 */
export function rollupDay(day?: string): number {
  const targetDay = day ?? dayKey(nowSec() - 86_400);
  const startSec = dayStartSec(targetDay);
  const endSec = startSec + 86_400;

  const rows = getDb()
    .prepare(
      `SELECT * FROM prices_hourly WHERE bucket_ts >= ? AND bucket_ts < ? ORDER BY bucket_ts ASC`,
    )
    .all(startSec, endSec) as HourlyRow[];

  const grouped = new Map<string, HourlyRow[]>();
  for (const r of rows) {
    const k = `${r.asset}|${r.source}`;
    let arr = grouped.get(k);
    if (!arr) { arr = []; grouped.set(k, arr); }
    arr.push(r);
  }

  let written = 0;
  for (const [k, hourly] of grouped) {
    const [asset, source] = k.split('|') as [string, string];

    const meanUsd = mean(hourly.map((h) => h.mean_usd).filter((v): v is number => v !== null));
    const twapUsd = mean(hourly.map((h) => h.twap_usd).filter((v): v is number => v !== null));
    const meanIrt = mean(hourly.map((h) => h.mean_irt).filter((v): v is number => v !== null));
    const twapIrt = mean(hourly.map((h) => h.twap_irt).filter((v): v is number => v !== null));

    let vNumUsd = 0, vNumIrt = 0, vDen = 0;
    let totalVol = 0;
    let samples = 0;
    for (const h of hourly) {
      samples += h.sample_count;
      const vol = h.volume ?? 0;
      totalVol += vol;
      if (vol > 0) {
        if (h.vwap_usd !== null) vNumUsd += h.vwap_usd * vol;
        if (h.vwap_irt !== null) vNumIrt += h.vwap_irt * vol;
        vDen += vol;
      }
    }
    const vwapUsd = vDen > 0 ? vNumUsd / vDen : null;
    const vwapIrt = vDen > 0 ? vNumIrt / vDen : null;

    upsertDaily({
      day: targetDay,
      asset,
      source,
      mean_usd: meanUsd,
      twap_usd: twapUsd,
      vwap_usd: vwapUsd,
      mean_irt: meanIrt,
      twap_irt: twapIrt,
      vwap_irt: vwapIrt,
      sample_count: samples,
      volume: totalVol > 0 ? totalVol : null,
    });
    written++;
  }

  logger.info({ day: targetDay, written }, 'daily rollup');
  return written;
}
