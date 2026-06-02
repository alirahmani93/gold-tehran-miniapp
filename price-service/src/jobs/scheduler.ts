import cron from 'node-cron';
import { config } from '../config.js';
import { pollAll } from '../collector/poller.js';
import { rollupHour } from '../aggregator/hourly.js';
import { rollupDay } from '../aggregator/daily.js';
import { canonicalDay, canonicalHour } from '../aggregator/canonical.js';
import { runRetention } from './retention.js';
import { logger } from '../utils/logger.js';
import { setCanonicalLast } from '../cache/redis.js';
import { getDb } from '../db/sqlite.js';
import { hourBucket, nowSec } from '../utils/time.js';
import { median, trimmedMean } from '../aggregator/stats.js';

/**
 * Light-touch canonical-last cache refresh — after each poll, recompute median over
 * fresh per-source last prices and write `price:last:<asset>`. Run on the same beat
 * as the poll, immediately after.
 */
async function refreshCanonicalLast(): Promise<void> {
  const cutoff = nowSec() - config.maxTickAgeSec;
  const rows = getDb()
    .prepare(
      `SELECT asset, source, price_usd, price_irt, ts
       FROM prices_raw
       WHERE ts >= ?`,
    )
    .all(cutoff) as { asset: string; source: string; price_usd: number | null; price_irt: number | null; ts: number }[];

  const byAsset = new Map<string, typeof rows>();
  for (const r of rows) {
    let arr = byAsset.get(r.asset);
    if (!arr) { arr = []; byAsset.set(r.asset, arr); }
    arr.push(r);
  }

  const ts = nowSec();
  await Promise.all(
    Array.from(byAsset.entries()).map(async ([asset, list]) => {
      // dedupe to most recent per source
      const latest = new Map<string, (typeof list)[number]>();
      for (const r of list) {
        const prev = latest.get(r.source);
        if (!prev || r.ts > prev.ts) latest.set(r.source, r);
      }
      const values = Array.from(latest.values());
      const usd = values.map((v) => v.price_usd).filter((v): v is number => v !== null && v > 0);
      const irt = values.map((v) => v.price_irt).filter((v): v is number => v !== null && v > 0);
      await setCanonicalLast(asset, {
        median_usd: median(usd),
        median_irt: median(irt),
        source_count: values.length,
        ts,
      });
      // attach trimmed_mean as a side metric in the same key? we only persisted median above;
      // for now the canonical-last cache only carries median + count + ts.
      void trimmedMean; // keep import live for clarity
    }),
  );
}

export function startScheduler(): void {
  // Poll
  cron.schedule(config.pollCron, async () => {
    logger.info('cron: poll');
    await pollAll();
    await refreshCanonicalLast().catch((err) =>
      logger.error({ err: err instanceof Error ? err.message : err }, 'canonical-last refresh failed'),
    );
  });

  // Hourly rollup at :02 of every hour — rolls up the just-completed hour
  cron.schedule('2 * * * *', () => {
    logger.info('cron: hourly rollup');
    const lastHour = hourBucket(nowSec()) - 3600;
    rollupHour(lastHour);
    canonicalHour(lastHour);
  });

  // Daily rollup at 00:05 UTC — rolls up yesterday
  cron.schedule('5 0 * * *', () => {
    logger.info('cron: daily rollup');
    rollupDay();
    canonicalDay();
  });

  // Retention at 03:00 UTC
  cron.schedule('0 3 * * *', () => {
    logger.info('cron: retention');
    runRetention();
  });

  logger.info({ pollCron: config.pollCron }, 'scheduler started');
}
