import { rollupHour } from '../aggregator/hourly.js';
import { canonicalHour } from '../aggregator/canonical.js';
import { closeDb } from '../db/sqlite.js';
import { hourBucket, nowSec } from '../utils/time.js';

const bucket = hourBucket(nowSec());
console.log('rolling up bucket', new Date(bucket * 1000).toISOString());
rollupHour(bucket);
canonicalHour(bucket);
closeDb();
