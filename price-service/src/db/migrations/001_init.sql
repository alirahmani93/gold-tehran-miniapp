-- raw ticks: one row per (asset, source) per poll
CREATE TABLE IF NOT EXISTS prices_raw (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ts            INTEGER NOT NULL,
  asset         TEXT    NOT NULL,
  source        TEXT    NOT NULL,
  price_native  REAL    NOT NULL,
  currency      TEXT    NOT NULL,
  price_usd     REAL,
  price_irt     REAL,
  volume        REAL
);
CREATE INDEX IF NOT EXISTS idx_raw_asset_source_ts ON prices_raw(asset, source, ts DESC);
CREATE INDEX IF NOT EXISTS idx_raw_ts              ON prices_raw(ts);

-- hourly aggregates per (asset, source)
CREATE TABLE IF NOT EXISTS prices_hourly (
  bucket_ts     INTEGER NOT NULL,
  asset         TEXT    NOT NULL,
  source        TEXT    NOT NULL,
  mean_usd      REAL,
  twap_usd      REAL,
  vwap_usd      REAL,
  mean_irt      REAL,
  twap_irt      REAL,
  vwap_irt      REAL,
  sample_count  INTEGER NOT NULL,
  volume        REAL,
  PRIMARY KEY (bucket_ts, asset, source)
);
CREATE INDEX IF NOT EXISTS idx_hourly_asset_ts  ON prices_hourly(asset, bucket_ts DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_source_ts ON prices_hourly(source, bucket_ts DESC);

-- daily aggregates per (asset, source)
CREATE TABLE IF NOT EXISTS prices_daily (
  day           TEXT    NOT NULL,
  asset         TEXT    NOT NULL,
  source        TEXT    NOT NULL,
  mean_usd      REAL,
  twap_usd      REAL,
  vwap_usd      REAL,
  mean_irt      REAL,
  twap_irt      REAL,
  vwap_irt      REAL,
  sample_count  INTEGER NOT NULL,
  volume        REAL,
  PRIMARY KEY (day, asset, source)
);
CREATE INDEX IF NOT EXISTS idx_daily_asset_day  ON prices_daily(asset, day DESC);
CREATE INDEX IF NOT EXISTS idx_daily_source_day ON prices_daily(source, day DESC);

-- canonical cross-source price per asset (median + trimmed mean)
CREATE TABLE IF NOT EXISTS prices_canonical_hourly (
  bucket_ts          INTEGER NOT NULL,
  asset              TEXT    NOT NULL,
  median_usd         REAL,
  trimmed_mean_usd   REAL,
  median_irt         REAL,
  trimmed_mean_irt   REAL,
  source_count       INTEGER NOT NULL,
  PRIMARY KEY (bucket_ts, asset)
);
CREATE INDEX IF NOT EXISTS idx_canon_asset_ts ON prices_canonical_hourly(asset, bucket_ts DESC);

CREATE TABLE IF NOT EXISTS prices_canonical_daily (
  day                TEXT    NOT NULL,
  asset              TEXT    NOT NULL,
  median_usd         REAL,
  trimmed_mean_usd   REAL,
  median_irt         REAL,
  trimmed_mean_irt   REAL,
  source_count       INTEGER NOT NULL,
  PRIMARY KEY (day, asset)
);

-- API tokens
CREATE TABLE IF NOT EXISTS api_tokens (
  token               TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  rate_limit_per_min  INTEGER NOT NULL DEFAULT 60,
  created_at          INTEGER NOT NULL,
  disabled_at         INTEGER
);

-- schema version
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
