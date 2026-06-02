import { getDb, closeDb } from '../db/sqlite.js';

const rows = getDb()
  .prepare(
    `SELECT asset, source, currency,
            ROUND(price_native, 2) AS native,
            ROUND(price_usd, 2) AS usd,
            ROUND(price_irt, 0) AS irt,
            ROUND(volume, 4) AS volume
     FROM prices_raw ORDER BY asset, currency`,
  )
  .all();
console.table(rows);
closeDb();
