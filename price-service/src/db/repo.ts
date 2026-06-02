import { getDb } from './sqlite.js';

export interface RawTick {
  ts: number;
  asset: string;
  source: string;
  price_native: number;
  currency: 'USD' | 'IRT' | 'USDT';
  price_usd: number | null;
  price_irt: number | null;
  volume: number | null;
}

export interface HourlyRow {
  bucket_ts: number;
  asset: string;
  source: string;
  mean_usd: number | null; twap_usd: number | null; vwap_usd: number | null;
  mean_irt: number | null; twap_irt: number | null; vwap_irt: number | null;
  sample_count: number;
  volume: number | null;
}

export interface DailyRow extends Omit<HourlyRow, 'bucket_ts'> { day: string }

export interface ApiToken {
  token: string;
  name: string;
  rate_limit_per_min: number;
  created_at: number;
  disabled_at: number | null;
}

export const insertRaw = (tick: RawTick): void => {
  getDb()
    .prepare(
      `INSERT INTO prices_raw (ts, asset, source, price_native, currency, price_usd, price_irt, volume)
       VALUES (@ts, @asset, @source, @price_native, @currency, @price_usd, @price_irt, @volume)`,
    )
    .run(tick);
};

export const insertRawMany = (ticks: RawTick[]): void => {
  if (ticks.length === 0) return;
  const stmt = getDb().prepare(
    `INSERT INTO prices_raw (ts, asset, source, price_native, currency, price_usd, price_irt, volume)
     VALUES (@ts, @asset, @source, @price_native, @currency, @price_usd, @price_irt, @volume)`,
  );
  const tx = getDb().transaction((rows: RawTick[]) => {
    for (const r of rows) stmt.run(r);
  });
  tx(ticks);
};

export const getRawInRange = (
  asset: string,
  source: string,
  fromTs: number,
  toTs: number,
): RawTick[] => {
  return getDb()
    .prepare(
      `SELECT ts, asset, source, price_native, currency, price_usd, price_irt, volume
       FROM prices_raw
       WHERE asset = ? AND source = ? AND ts >= ? AND ts < ?
       ORDER BY ts ASC`,
    )
    .all(asset, source, fromTs, toTs) as RawTick[];
};

export const distinctAssetSourcePairsInRange = (fromTs: number, toTs: number): { asset: string; source: string }[] => {
  return getDb()
    .prepare(
      `SELECT DISTINCT asset, source FROM prices_raw WHERE ts >= ? AND ts < ?`,
    )
    .all(fromTs, toTs) as { asset: string; source: string }[];
};

export const upsertHourly = (row: HourlyRow): void => {
  getDb()
    .prepare(
      `INSERT INTO prices_hourly
       (bucket_ts, asset, source, mean_usd, twap_usd, vwap_usd, mean_irt, twap_irt, vwap_irt, sample_count, volume)
       VALUES (@bucket_ts, @asset, @source, @mean_usd, @twap_usd, @vwap_usd, @mean_irt, @twap_irt, @vwap_irt, @sample_count, @volume)
       ON CONFLICT(bucket_ts, asset, source) DO UPDATE SET
         mean_usd=excluded.mean_usd, twap_usd=excluded.twap_usd, vwap_usd=excluded.vwap_usd,
         mean_irt=excluded.mean_irt, twap_irt=excluded.twap_irt, vwap_irt=excluded.vwap_irt,
         sample_count=excluded.sample_count, volume=excluded.volume`,
    )
    .run(row);
};

export const upsertDaily = (row: DailyRow): void => {
  getDb()
    .prepare(
      `INSERT INTO prices_daily
       (day, asset, source, mean_usd, twap_usd, vwap_usd, mean_irt, twap_irt, vwap_irt, sample_count, volume)
       VALUES (@day, @asset, @source, @mean_usd, @twap_usd, @vwap_usd, @mean_irt, @twap_irt, @vwap_irt, @sample_count, @volume)
       ON CONFLICT(day, asset, source) DO UPDATE SET
         mean_usd=excluded.mean_usd, twap_usd=excluded.twap_usd, vwap_usd=excluded.vwap_usd,
         mean_irt=excluded.mean_irt, twap_irt=excluded.twap_irt, vwap_irt=excluded.vwap_irt,
         sample_count=excluded.sample_count, volume=excluded.volume`,
    )
    .run(row);
};

export const upsertCanonicalHourly = (row: {
  bucket_ts: number; asset: string;
  median_usd: number | null; trimmed_mean_usd: number | null;
  median_irt: number | null; trimmed_mean_irt: number | null;
  source_count: number;
}): void => {
  getDb()
    .prepare(
      `INSERT INTO prices_canonical_hourly
       (bucket_ts, asset, median_usd, trimmed_mean_usd, median_irt, trimmed_mean_irt, source_count)
       VALUES (@bucket_ts, @asset, @median_usd, @trimmed_mean_usd, @median_irt, @trimmed_mean_irt, @source_count)
       ON CONFLICT(bucket_ts, asset) DO UPDATE SET
         median_usd=excluded.median_usd, trimmed_mean_usd=excluded.trimmed_mean_usd,
         median_irt=excluded.median_irt, trimmed_mean_irt=excluded.trimmed_mean_irt,
         source_count=excluded.source_count`,
    )
    .run(row);
};

export const upsertCanonicalDaily = (row: {
  day: string; asset: string;
  median_usd: number | null; trimmed_mean_usd: number | null;
  median_irt: number | null; trimmed_mean_irt: number | null;
  source_count: number;
}): void => {
  getDb()
    .prepare(
      `INSERT INTO prices_canonical_daily
       (day, asset, median_usd, trimmed_mean_usd, median_irt, trimmed_mean_irt, source_count)
       VALUES (@day, @asset, @median_usd, @trimmed_mean_usd, @median_irt, @trimmed_mean_irt, @source_count)
       ON CONFLICT(day, asset) DO UPDATE SET
         median_usd=excluded.median_usd, trimmed_mean_usd=excluded.trimmed_mean_usd,
         median_irt=excluded.median_irt, trimmed_mean_irt=excluded.trimmed_mean_irt,
         source_count=excluded.source_count`,
    )
    .run(row);
};

export const getDistinctAssetsInHourBucket = (bucketTs: number): string[] => {
  return (getDb()
    .prepare(`SELECT DISTINCT asset FROM prices_hourly WHERE bucket_ts = ?`)
    .all(bucketTs) as { asset: string }[]).map((r) => r.asset);
};

export const getHourlyForBucket = (bucketTs: number, asset: string): HourlyRow[] => {
  return getDb()
    .prepare(`SELECT * FROM prices_hourly WHERE bucket_ts = ? AND asset = ?`)
    .all(bucketTs, asset) as HourlyRow[];
};

export const getHourlyForDay = (day: string, asset: string, source: string): HourlyRow[] => {
  // day = YYYY-MM-DD; use bucket_ts range
  const [y, m, d] = day.split('-').map(Number);
  const startSec = Math.floor(Date.UTC(y!, (m ?? 1) - 1, d ?? 1) / 1000);
  return getDb()
    .prepare(
      `SELECT * FROM prices_hourly
       WHERE asset = ? AND source = ? AND bucket_ts >= ? AND bucket_ts < ?
       ORDER BY bucket_ts ASC`,
    )
    .all(asset, source, startSec, startSec + 86_400) as HourlyRow[];
};

export const getDistinctAssetsForDay = (day: string): string[] => {
  const [y, m, d] = day.split('-').map(Number);
  const startSec = Math.floor(Date.UTC(y!, (m ?? 1) - 1, d ?? 1) / 1000);
  return (getDb()
    .prepare(`SELECT DISTINCT asset FROM prices_hourly WHERE bucket_ts >= ? AND bucket_ts < ?`)
    .all(startSec, startSec + 86_400) as { asset: string }[]).map((r) => r.asset);
};

// --- history / api helpers
export const historyHourly = (
  asset: string,
  source: string | null,
  fromTs: number,
  toTs: number,
): HourlyRow[] => {
  if (source) {
    return getDb()
      .prepare(
        `SELECT * FROM prices_hourly
         WHERE asset = ? AND source = ? AND bucket_ts >= ? AND bucket_ts < ?
         ORDER BY bucket_ts ASC`,
      )
      .all(asset, source, fromTs, toTs) as HourlyRow[];
  }
  return getDb()
    .prepare(
      `SELECT * FROM prices_hourly
       WHERE asset = ? AND bucket_ts >= ? AND bucket_ts < ?
       ORDER BY bucket_ts ASC, source ASC`,
    )
    .all(asset, fromTs, toTs) as HourlyRow[];
};

export const historyCanonicalHourly = (asset: string, fromTs: number, toTs: number) => {
  return getDb()
    .prepare(
      `SELECT * FROM prices_canonical_hourly
       WHERE asset = ? AND bucket_ts >= ? AND bucket_ts < ?
       ORDER BY bucket_ts ASC`,
    )
    .all(asset, fromTs, toTs);
};

export const historyDaily = (asset: string, source: string | null, fromDay: string, toDay: string) => {
  if (source) {
    return getDb()
      .prepare(
        `SELECT * FROM prices_daily
         WHERE asset = ? AND source = ? AND day >= ? AND day <= ?
         ORDER BY day ASC`,
      )
      .all(asset, source, fromDay, toDay);
  }
  return getDb()
    .prepare(
      `SELECT * FROM prices_daily
       WHERE asset = ? AND day >= ? AND day <= ?
       ORDER BY day ASC, source ASC`,
    )
    .all(asset, fromDay, toDay);
};

export const sourceDailyAll = (source: string, day: string) => {
  return getDb()
    .prepare(
      `SELECT * FROM prices_daily WHERE source = ? AND day = ? ORDER BY asset ASC`,
    )
    .all(source, day);
};

// --- retention
export const deleteRawOlderThan = (tsCutoff: number): number => {
  const r = getDb().prepare(`DELETE FROM prices_raw WHERE ts < ?`).run(tsCutoff);
  return r.changes;
};

export const deleteHourlyOlderThan = (tsCutoff: number): number => {
  const r = getDb().prepare(`DELETE FROM prices_hourly WHERE bucket_ts < ?`).run(tsCutoff);
  return r.changes;
};

export const deleteDailyOlderThan = (dayCutoff: string): number => {
  const r = getDb().prepare(`DELETE FROM prices_daily WHERE day < ?`).run(dayCutoff);
  return r.changes;
};

// --- tokens
export const insertToken = (t: ApiToken): void => {
  getDb()
    .prepare(
      `INSERT INTO api_tokens (token, name, rate_limit_per_min, created_at, disabled_at)
       VALUES (@token, @name, @rate_limit_per_min, @created_at, @disabled_at)
       ON CONFLICT(token) DO UPDATE SET
         name=excluded.name, rate_limit_per_min=excluded.rate_limit_per_min, disabled_at=excluded.disabled_at`,
    )
    .run(t);
};

export const findToken = (token: string): ApiToken | undefined => {
  return getDb()
    .prepare(`SELECT * FROM api_tokens WHERE token = ? AND disabled_at IS NULL`)
    .get(token) as ApiToken | undefined;
};
