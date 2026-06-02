import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, closeDb } from './sqlite.js';
import { logger } from '../utils/logger.js';
import { nowSec } from '../utils/time.js';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, 'migrations');

export function runMigrations(): void {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL
  )`);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_version').all().map((r: any) => r.version as number),
  );

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const version = Number.parseInt(file.split('_')[0]!, 10);
    if (applied.has(version)) continue;
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    logger.info({ file, version }, 'applying migration');
    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(version, nowSec());
    });
    tx();
  }
  logger.info('migrations up-to-date');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
  closeDb();
}
