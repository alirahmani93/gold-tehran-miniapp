import Fastify from 'fastify';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './db/migrate.js';
import { closeDb } from './db/sqlite.js';
import { closeRedis, getRedis } from './cache/redis.js';
import { registerAuth } from './api/auth.js';
import { healthRoutes } from './api/routes/health.js';
import { priceRoutes } from './api/routes/price.js';
import { startScheduler } from './jobs/scheduler.js';
import { bootstrapTokens } from './scripts/bootstrap-tokens.js';

async function main(): Promise<void> {
  runMigrations();
  bootstrapTokens();

  // warm Redis
  await getRedis().ping().catch((err: unknown) => {
    logger.error({ err: err instanceof Error ? err.message : err }, 'redis ping failed at startup');
  });

  const app = Fastify({ logger: false, trustProxy: true });

  await healthRoutes(app);
  await registerAuth(app);
  await priceRoutes(app);

  app.setErrorHandler((err: Error, _req, reply) => {
    logger.error({ err: err.message, stack: err.stack }, 'unhandled error');
    reply.code(500).send({ error: 'internal' });
  });

  startScheduler();

  await app.listen({ port: config.port, host: config.host });
  logger.info({ port: config.port, host: config.host }, 'price-service listening');

  const shutdown = async (sig: string) => {
    logger.info({ sig }, 'shutting down');
    try { await app.close(); } catch {}
    try { await closeRedis(); } catch {}
    try { closeDb(); } catch {}
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : err }, 'fatal startup error');
  process.exit(1);
});
