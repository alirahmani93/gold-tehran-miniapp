/** Numeric helpers used by the aggregators. */

export const mean = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  let sum = 0;
  for (const x of xs) sum += x;
  return sum / xs.length;
};

export const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
};

/**
 * Trimmed mean: drop the lowest and highest `trim` fraction of values, then mean the rest.
 * trim=0.1 → drop bottom 10% and top 10%. Falls back to mean if too few samples.
 */
export const trimmedMean = (xs: number[], trim = 0.1): number | null => {
  if (xs.length === 0) return null;
  if (xs.length < 5) return mean(xs);
  const s = [...xs].sort((a, b) => a - b);
  const k = Math.floor(s.length * trim);
  const sliced = s.slice(k, s.length - k);
  return mean(sliced);
};

/**
 * Time-Weighted Average Price across (ts, price) samples.
 * Each sample's price is weighted by the duration to the next sample;
 * the last sample is weighted by (windowEnd - lastTs) so the full window is covered.
 * Returns null if windowEnd <= windowStart or no samples in window.
 */
export const twap = (
  samples: { ts: number; price: number }[],
  windowStart: number,
  windowEnd: number,
): number | null => {
  if (samples.length === 0 || windowEnd <= windowStart) return null;
  const sorted = [...samples].sort((a, b) => a.ts - b.ts);
  let weighted = 0;
  let totalDur = 0;
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const startEff = Math.max(cur.ts, windowStart);
    const nextTs = i + 1 < sorted.length ? sorted[i + 1]!.ts : windowEnd;
    const endEff = Math.min(nextTs, windowEnd);
    const dur = Math.max(0, endEff - startEff);
    if (dur > 0) {
      weighted += cur.price * dur;
      totalDur += dur;
    }
  }
  return totalDur > 0 ? weighted / totalDur : null;
};

/**
 * Volume-Weighted Average Price.
 * Each sample is weighted by its volume contribution. Returns null if total volume is 0/missing.
 * For monitoring at 15-min cadence we use base-unit volume deltas where available,
 * otherwise we treat each sample's reported volumeBase as its weight (an approximation).
 */
export const vwap = (samples: { price: number; volume: number | null }[]): number | null => {
  let num = 0;
  let den = 0;
  for (const s of samples) {
    if (s.volume === null || s.volume <= 0) continue;
    num += s.price * s.volume;
    den += s.volume;
  }
  return den > 0 ? num / den : null;
};
