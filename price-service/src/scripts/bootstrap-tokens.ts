import { config } from '../config.js';
import { insertToken } from '../db/repo.js';
import { logger } from '../utils/logger.js';
import { nowSec } from '../utils/time.js';

/**
 * Parse BOOTSTRAP_TOKENS env (format: name:token:rate_per_min, comma-separated)
 * and insert/update each. Idempotent. No-op when env is empty.
 */
export function bootstrapTokens(): void {
  const raw = config.bootstrapTokens.trim();
  if (!raw) return;
  const entries = raw.split(',').map((s) => s.trim()).filter(Boolean);
  for (const entry of entries) {
    const [name, token, rateStr] = entry.split(':');
    if (!name || !token) {
      logger.warn({ entry }, 'invalid BOOTSTRAP_TOKENS entry — skipping');
      continue;
    }
    const rate = Number.parseInt(rateStr ?? '60', 10) || 60;
    insertToken({
      token,
      name,
      rate_limit_per_min: rate,
      created_at: nowSec(),
      disabled_at: null,
    });
    logger.info({ name, rate }, 'bootstrap token registered');
  }
}
