import { Redis } from 'ioredis';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (client) return client;
  client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    enableReadyCheck: true,
  });
  client.on('error', (err: unknown) => logger.error({ err: err instanceof Error ? err.message : err }, 'redis error'));
  client.on('connect', () => logger.info('redis connected'));
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

// --- last-price helpers
export interface LastPrice {
  asset: string;
  source: string;
  ts: number;
  price_native: number;
  currency: string;
  price_usd: number | null;
  price_irt: number | null;
  volume: number | null;
}

const keyAssetSource = (asset: string, source: string) => `price:last:${asset}:${source}`;
const keyAsset = (asset: string) => `price:last:${asset}`;

export async function setLast(p: LastPrice, ttlSec = 86_400): Promise<void> {
  const r = getRedis();
  await r.set(keyAssetSource(p.asset, p.source), JSON.stringify(p), 'EX', ttlSec);
}

export async function getLast(asset: string, source: string): Promise<LastPrice | null> {
  const v = await getRedis().get(keyAssetSource(asset, source));
  return v ? (JSON.parse(v) as LastPrice) : null;
}

export async function setCanonicalLast(
  asset: string,
  payload: { median_usd: number | null; median_irt: number | null; source_count: number; ts: number },
  ttlSec = 86_400,
): Promise<void> {
  await getRedis().set(keyAsset(asset), JSON.stringify(payload), 'EX', ttlSec);
}

export async function getCanonicalLast(asset: string) {
  const v = await getRedis().get(keyAsset(asset));
  return v ? JSON.parse(v) : null;
}

// scan all source keys for a given asset
export async function getAllSourcesLast(asset: string): Promise<LastPrice[]> {
  const r = getRedis();
  const stream = r.scanStream({ match: `price:last:${asset}:*`, count: 100 });
  const keys: string[] = [];
  for await (const chunk of stream as AsyncIterable<string[]>) keys.push(...chunk);
  if (keys.length === 0) return [];
  const vals = await r.mget(...keys);
  return vals.filter((v: string | null): v is string => !!v).map((v: string) => JSON.parse(v) as LastPrice);
}

// --- rate limit (fixed-window token bucket per minute)
export async function rateLimitHit(
  token: string,
  limitPerMin: number,
): Promise<{ allowed: boolean; remaining: number; resetSec: number }> {
  const r = getRedis();
  const minute = Math.floor(Date.now() / 60_000);
  const key = `rl:${token}:${minute}`;
  const pipe = r.multi();
  pipe.incr(key);
  pipe.expire(key, 65);
  const res = await pipe.exec();
  const count = Number(res?.[0]?.[1] ?? 0);
  const remaining = Math.max(0, limitPerMin - count);
  const resetSec = (minute + 1) * 60 - Math.floor(Date.now() / 1000);
  return { allowed: count <= limitPerMin, remaining, resetSec };
}

// --- FX cache (last known USDT/IRT to fall back if a poll misses it)
const FX_KEY = 'fx:usdt_irt';
export async function setFx(rate: number, ts: number): Promise<void> {
  await getRedis().set(FX_KEY, JSON.stringify({ rate, ts }));
}
export async function getFx(): Promise<{ rate: number; ts: number } | null> {
  const v = await getRedis().get(FX_KEY);
  return v ? JSON.parse(v) : null;
}
