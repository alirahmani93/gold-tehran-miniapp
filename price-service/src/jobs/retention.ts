import { deleteDailyOlderThan, deleteHourlyOlderThan, deleteRawOlderThan } from '../db/repo.js';
import { config } from '../config.js';
import { dayKey, nowSec } from '../utils/time.js';
import { logger } from '../utils/logger.js';

export function runRetention(): { raw: number; hourly: number; daily: number } {
  const now = nowSec();
  const rawCutoff = now - config.rawRetentionDays * 86_400;
  const hourlyCutoff = now - config.hourlyRetentionDays * 86_400;
  const dailyCutoff = dayKey(now - config.dailyRetentionDays * 86_400);

  const raw = deleteRawOlderThan(rawCutoff);
  const hourly = deleteHourlyOlderThan(hourlyCutoff);
  const daily = deleteDailyOlderThan(dailyCutoff);

  logger.info({ raw, hourly, daily, rawCutoff, hourlyCutoff, dailyCutoff }, 'retention complete');
  return { raw, hourly, daily };
}
