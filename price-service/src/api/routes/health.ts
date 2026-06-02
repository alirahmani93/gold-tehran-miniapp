import type { FastifyInstance } from 'fastify';
import { getDb } from '../../db/sqlite.js';
import { getRedis } from '../../cache/redis.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/health', async () => {
    const checks: Record<string, 'ok' | string> = {};
    try {
      getDb().prepare('SELECT 1').get();
      checks.sqlite = 'ok';
    } catch (e) {
      checks.sqlite = e instanceof Error ? e.message : 'err';
    }
    try {
      await getRedis().ping();
      checks.redis = 'ok';
    } catch (e) {
      checks.redis = e instanceof Error ? e.message : 'err';
    }
    const ok = Object.values(checks).every((v) => v === 'ok');
    return { ok, checks, ts: Math.floor(Date.now() / 1000) };
  });
}
