import { runMigrations } from '../db/migrate.js';
import { closeDb } from '../db/sqlite.js';
import { closeRedis } from '../cache/redis.js';
import { pollAll } from '../collector/poller.js';
import { logger } from '../utils/logger.js';

async function main() {
  runMigrations();
  const res = await pollAll();
  logger.info({ res }, 'poll-once done');
  await closeRedis();
  closeDb();
}

main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : err }, 'poll-once failed');
  process.exit(1);
});
