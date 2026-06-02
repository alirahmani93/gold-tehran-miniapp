import type { FastifyInstance } from 'fastify';
import {
  getAllSourcesLast,
  getCanonicalLast,
  getLast,
} from '../../cache/redis.js';
import {
  historyCanonicalHourly,
  historyDaily,
  historyHourly,
  sourceDailyAll,
} from '../../db/repo.js';
import { ASSETS, SOURCES } from '../../sources/registry.js';
import { config } from '../../config.js';
import { nowSec } from '../../utils/time.js';

export async function priceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/assets', async () => ({
    assets: ASSETS.map((a) => ({
      code: a.code,
      label: a.label,
      kind: a.kind,
      sources: a.sources,
    })),
    sources: SOURCES,
  }));

  /** Last canonical price + per-source breakdown for an asset. */
  app.get<{ Params: { asset: string } }>('/v1/price/:asset', async (req, reply) => {
    const asset = req.params.asset.toUpperCase();
    const [canon, sources] = await Promise.all([
      getCanonicalLast(asset),
      getAllSourcesLast(asset),
    ]);
    const cutoff = nowSec() - config.maxTickAgeSec;
    const fresh = sources.filter((s) => s.ts >= cutoff);
    if (!canon && fresh.length === 0) {
      return reply.code(404).send({ error: 'no recent price', asset });
    }
    return {
      asset,
      canonical: canon ?? null,
      sources: sources.map((s) => ({ ...s, stale: s.ts < cutoff })),
    };
  });

  /** Last tick from a single source. */
  app.get<{ Params: { asset: string; source: string } }>(
    '/v1/price/:asset/:source',
    async (req, reply) => {
      const asset = req.params.asset.toUpperCase();
      const source = req.params.source.toLowerCase();
      const last = await getLast(asset, source);
      if (!last) return reply.code(404).send({ error: 'no recent price', asset, source });
      return { ...last, stale: last.ts < nowSec() - config.maxTickAgeSec };
    },
  );

  /** Time-series history. bucket=hour|day; source optional (omit = canonical). */
  app.get<{
    Params: { asset: string };
    Querystring: { bucket?: 'hour' | 'day'; source?: string; from?: string; to?: string };
  }>('/v1/price/:asset/history', async (req, reply) => {
    const asset = req.params.asset.toUpperCase();
    const bucket = (req.query.bucket ?? 'hour') as 'hour' | 'day';
    const source = req.query.source?.toLowerCase() ?? null;

    if (bucket === 'hour') {
      const to = req.query.to ? Number.parseInt(req.query.to, 10) : nowSec();
      const from = req.query.from
        ? Number.parseInt(req.query.from, 10)
        : to - 24 * 3600;
      if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
        return reply.code(400).send({ error: 'bad from/to' });
      }
      const rows = source
        ? historyHourly(asset, source, from, to)
        : historyCanonicalHourly(asset, from, to);
      return { asset, bucket, source, from, to, rows };
    }

    // day bucket — from/to are YYYY-MM-DD
    const toDay = req.query.to ?? new Date().toISOString().slice(0, 10);
    const fromDay =
      req.query.from ??
      new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const rows = historyDaily(asset, source, fromDay, toDay);
    return { asset, bucket, source, from: fromDay, to: toDay, rows };
  });

  /** All assets' daily aggregates for a given source + day. */
  app.get<{
    Params: { source: string };
    Querystring: { date?: string };
  }>('/v1/sources/:source/daily', async (req, reply) => {
    const source = req.params.source.toLowerCase();
    const date =
      req.query.date ??
      new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const rows = sourceDailyAll(source, date);
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'no data', source, date });
    }
    return { source, date, rows };
  });
}
