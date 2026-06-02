import { BitpinSource } from '../sources/bitpin.js';
import { GoldSpotSource } from '../sources/goldspot.js';
import type { Source } from '../sources/Source.js';
import { normalize } from './normalizer.js';
import { insertRawMany } from '../db/repo.js';
import { setLast } from '../cache/redis.js';
import { logger } from '../utils/logger.js';

const SOURCES: Source[] = [new BitpinSource(), new GoldSpotSource()];

export async function pollAll(): Promise<{ source: string; ticks: number; error?: string }[]> {
  return Promise.all(SOURCES.map(pollOne));
}

async function pollOne(src: Source): Promise<{ source: string; ticks: number; error?: string }> {
  const start = Date.now();
  try {
    const quotes = await src.fetch();
    const ticks = await normalize(src.name, quotes);
    insertRawMany(ticks);
    await Promise.all(
      ticks.map((t) =>
        setLast({
          asset: t.asset,
          source: t.source,
          ts: t.ts,
          price_native: t.price_native,
          currency: t.currency,
          price_usd: t.price_usd,
          price_irt: t.price_irt,
          volume: t.volume,
        }),
      ),
    );
    logger.info({ source: src.name, ticks: ticks.length, ms: Date.now() - start }, 'poll ok');
    return { source: src.name, ticks: ticks.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ source: src.name, err: msg, ms: Date.now() - start }, 'poll failed');
    return { source: src.name, ticks: 0, error: msg };
  }
}
