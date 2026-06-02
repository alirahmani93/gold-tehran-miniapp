# price-service

Price aggregation microservice for gold, coin, crypto, and FX.

**Current coverage (one source — Bitpin):** BTC, ETH, USDT, PAXG (both IRT and USDT quotes).
**Stubbed (no source yet):** USD, XAU_18K, XAU_24K, MESGHAL, GRAM, BAHAR_FULL/HALF/QUARTER.
A future TGJU/Milli collector will fill those in. The API returns `404 no recent price`
for an asset that has no live source rather than fabricating from PAXG.

## What it does

- Polls each source on a cron beat (default: every 15 min)
- Stores raw ticks in SQLite, last prices in Redis
- Normalizes everything to both USD and IRT using the in-batch USDT/IRT rate (or last-known FX cache)
- Rolls up every hour and every day per `(asset, source)` — **mean**, **TWAP**, **VWAP**
- Computes a canonical cross-source price per asset — **median** and **trimmed mean**
- Serves REST endpoints with `x-api-token` auth and per-token rate limiting

> **Honest caveats.** Today only Bitpin is wired, so "cross-source" canonical = Bitpin's
> own number. Code is structured so adding a second source is just a new file under
> `src/sources/` plus an entry in the registry — no core changes. VWAP weights use the
> source's reported 24h base-unit volume; this is an approximation suitable for monitoring,
> not for trading. We assume `1 USDT ≈ 1 USD` for normalization (industry default).

## Stack

- Node 20+ / TypeScript / ESM
- Fastify
- better-sqlite3 (WAL mode)
- ioredis
- node-cron
- undici (fetch)

## Setup

```bash
cd price-service
cp .env.example .env
docker compose up -d              # local Redis on 127.0.0.1:6390
npm install
npm run migrate                   # creates data/prices.db
npm run token:create -- myapp 120 # prints { name, token, rate_limit_per_min }
npm run dev
```

## Smoke test (no server needed)

```bash
npm run poll:once                 # one-shot poll → SQLite + Redis
npx tsx src/scripts/inspect.ts    # dump prices_raw
npx tsx src/scripts/rollup-now.ts # force rollup of the current hour bucket
```

## API

All endpoints except `/v1/health` require `x-api-token: <token>`.
Rate limit (per-token, per-minute) is enforced in Redis; remaining count + reset are returned as headers.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/health` | unauthenticated health check |
| GET | `/v1/assets` | supported assets + which sources cover each |
| GET | `/v1/price/:asset` | last canonical price + per-source breakdown |
| GET | `/v1/price/:asset/:source` | last tick from one source |
| GET | `/v1/price/:asset/history?bucket=hour\|day&source=&from=&to=` | time series (hourly `from/to` = unix seconds; daily = `YYYY-MM-DD`) |
| GET | `/v1/sources/:source/daily?date=YYYY-MM-DD` | all assets, one source, one day |

### Examples

```bash
TOKEN=...
curl -H "x-api-token: $TOKEN" localhost:4000/v1/price/BTC
curl -H "x-api-token: $TOKEN" localhost:4000/v1/price/BTC/bitpin
curl -H "x-api-token: $TOKEN" "localhost:4000/v1/price/BTC/history?bucket=hour&from=1780300000&to=1780402000"
curl -H "x-api-token: $TOKEN" "localhost:4000/v1/sources/bitpin/daily?date=2026-06-01"
```

## Configuration

| Env | Default | Notes |
|-----|---------|-------|
| `PORT` | `4000` | |
| `SQLITE_PATH` | `./data/prices.db` | |
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | docker-compose uses `:6390` |
| `POLL_CRON` | `*/15 * * * *` | every 15 min |
| `MAX_TICK_AGE_SEC` | `1800` | ticks older than this are marked stale and excluded from canonical |
| `RAW_RETENTION_DAYS` | `31` | configurable retention as requested |
| `HOURLY_RETENTION_DAYS` | `120` | |
| `DAILY_RETENTION_DAYS` | `3650` | |
| `BITPIN_BASE_URL` | `https://api.bitpin.org` | confirmed via live probe |
| `BOOTSTRAP_TOKENS` | empty | `name:token:rate,name2:token2:rate2` for one-shot bootstrap |

## Data model

- `prices_raw` — one row per `(ts, asset, source)`; native + USD + IRT + volume
- `prices_hourly` — `(bucket_ts, asset, source)`; mean / TWAP / VWAP, USD + IRT
- `prices_daily` — `(day, asset, source)`; rolled from hourly
- `prices_canonical_hourly` / `prices_canonical_daily` — `(bucket_ts|day, asset)`; median + trimmed mean across sources

## Cron schedule

- `*/15 * * * *` — poll all sources, write raw, update Redis last
- `2 * * * *` — roll up the just-completed hour, then compute canonical for that hour
- `5 0 * * *` — roll up yesterday (hourly→daily and canonical daily)
- `0 3 * * *` — retention cleanup

## Adding a new source

1. `src/sources/foo.ts` — implement `Source.fetch(): Promise<RawQuote[]>`
2. Map foo's market keys → canonical asset codes in `src/sources/registry.ts`
3. Register the instance in `src/collector/poller.ts` (`SOURCES` array)
4. Update each asset's `bitpinCoverage`/source list in the registry

No DB migration needed.

## Known limitations (today, by design)

- Single source → canonical median == that source's value
- Bitpin doesn't carry physical gold or Bahar Azadi coins; those return 404 until source #2 lands
- `price_usd` for USDT-quoted markets assumes `1 USDT = 1 USD` (~±1% during de-pegs)
- VWAP weights use 24h volume snapshots; a true tick-level VWAP would need a higher-frequency feed
