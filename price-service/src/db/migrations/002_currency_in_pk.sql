-- Sources can quote the same asset in multiple currencies (e.g. Bitpin BTC/IRT and
-- BTC/USDT are separate order books). Treat each (asset, source, currency) as its own
-- aggregate row. Raw layer already carries `currency`, no change there.

DROP TABLE IF EXISTS prices_hourly;
DROP TABLE IF EXISTS prices_daily;

CREATE TABLE prices_hourly (
  bucket_ts     INTEGER NOT NULL,
  asset         TEXT    NOT NULL,
  source        TEXT    NOT NULL,
  currency      TEXT    NOT NULL,
  mean_usd      REAL,
  twap_usd      REAL,
  vwap_usd      REAL,
  mean_irt      REAL,
  twap_irt      REAL,
  vwap_irt      REAL,
  sample_count  INTEGER NOT NULL,
  volume        REAL,
  PRIMARY KEY (bucket_ts, asset, source, currency)
);
CREATE INDEX idx_hourly_asset_ts  ON prices_hourly(asset, bucket_ts DESC);
CREATE INDEX idx_hourly_source_ts ON prices_hourly(source, bucket_ts DESC);

CREATE TABLE prices_daily (
  day           TEXT    NOT NULL,
  asset         TEXT    NOT NULL,
  source        TEXT    NOT NULL,
  currency      TEXT    NOT NULL,
  mean_usd      REAL,
  twap_usd      REAL,
  vwap_usd      REAL,
  mean_irt      REAL,
  twap_irt      REAL,
  vwap_irt      REAL,
  sample_count  INTEGER NOT NULL,
  volume        REAL,
  PRIMARY KEY (day, asset, source, currency)
);
CREATE INDEX idx_daily_asset_day  ON prices_daily(asset, day DESC);
CREATE INDEX idx_daily_source_day ON prices_daily(source, day DESC);
