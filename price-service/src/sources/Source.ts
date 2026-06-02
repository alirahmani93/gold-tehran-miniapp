/**
 * A Source emits one or more raw quotes per fetch().
 * Each quote is "native" — the value as-quoted by the exchange.
 * Normalization to USD/IRT happens in the collector pipeline (it needs FX context).
 */
export interface RawQuote {
  asset: string;             // canonical asset code, e.g. 'BTC','USDT','PAXG','ETH'
  price: number;             // native price (>= 0)
  currency: 'IRT' | 'USDT' | 'USD';
  volumeBase?: number | null;  // 24h volume in base units, if known
  ts: number;                // unix seconds
}

export interface Source {
  readonly name: string;     // e.g. 'bitpin'
  fetch(): Promise<RawQuote[]>;
}
