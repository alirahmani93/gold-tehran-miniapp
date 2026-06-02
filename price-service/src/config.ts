import 'dotenv/config';

function str(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid int env ${name}=${v}`);
  return n;
}

export const config = {
  env: str('NODE_ENV', 'development'),
  port: int('PORT', 4000),
  host: str('HOST', '0.0.0.0'),
  logLevel: str('LOG_LEVEL', 'info'),

  sqlitePath: str('SQLITE_PATH', './data/prices.db'),
  redisUrl: str('REDIS_URL', 'redis://127.0.0.1:6379/0'),

  pollCron: str('POLL_CRON', '*/15 * * * *'),
  maxTickAgeSec: int('MAX_TICK_AGE_SEC', 1800),

  rawRetentionDays: int('RAW_RETENTION_DAYS', 31),
  hourlyRetentionDays: int('HOURLY_RETENTION_DAYS', 120),
  dailyRetentionDays: int('DAILY_RETENTION_DAYS', 3650),

  bitpinBaseUrl: str('BITPIN_BASE_URL', 'https://api.bitpin.org'),
  bitpinTimeoutMs: int('BITPIN_TIMEOUT_MS', 10_000),

  fxFallbackMaxAgeSec: int('FX_FALLBACK_MAX_AGE_SEC', 3600),

  bootstrapTokens: str('BOOTSTRAP_TOKENS', ''),
} as const;

export type Config = typeof config;
