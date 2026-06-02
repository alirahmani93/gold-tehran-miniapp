import { randomBytes } from 'node:crypto';
import { runMigrations } from '../db/migrate.js';
import { closeDb } from '../db/sqlite.js';
import { insertToken } from '../db/repo.js';
import { nowSec } from '../utils/time.js';

/**
 * Usage: npm run token:create -- <name> [rate_per_min]
 */
function main() {
  const args = process.argv.slice(2);
  const name = args[0];
  const rate = Number.parseInt(args[1] ?? '60', 10) || 60;
  if (!name) {
    console.error('usage: token:create <name> [rate_per_min]');
    process.exit(1);
  }
  runMigrations();
  const token = randomBytes(24).toString('base64url');
  insertToken({ token, name, rate_limit_per_min: rate, created_at: nowSec(), disabled_at: null });
  console.log(JSON.stringify({ name, token, rate_limit_per_min: rate }, null, 2));
  closeDb();
}

main();
