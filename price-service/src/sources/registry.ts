/**
 * Canonical asset registry.
 *
 * `ASSETS` lists every canonical asset the service tracks, with the set of sources that
 * cover it. `BITPIN_PAIRS` maps Bitpin market "base/quote" → which canonical asset(s) to
 * emit and in which native currency.
 *
 * Bitpin carries crypto + tokenized assets (BTC, ETH, USDT, PAXG). The `goldspot` source
 * emits world spot gold (XAU, USD/oz). Physical gold (XAU_18K, MESGHAL, GRAM) and
 * physical coins (BAHAR_FULL, BAHAR_HALF, BAHAR_QUARTER) still have no source — they
 * need a future TGJU/Milli collector. The API reports `404 no recent price` for assets
 * with `sources: []` rather than fabricate from XAU/PAXG.
 */

export const SOURCES = ['bitpin', 'goldspot'] as const;
export type SourceName = (typeof SOURCES)[number];

export type AssetCode =
  | 'BTC' | 'ETH' | 'USDT' | 'PAXG'
  | 'XAU' | 'XAU_18K' | 'XAU_24K' | 'MESGHAL' | 'GRAM'
  | 'BAHAR_FULL' | 'BAHAR_HALF' | 'BAHAR_QUARTER'
  | 'USD';

export interface AssetMeta {
  code: AssetCode;
  kind: 'crypto' | 'tokenized_gold' | 'spot_metal' | 'physical_gold' | 'physical_coin' | 'fiat';
  label: string;
  /** Names of sources that emit this asset. Empty = no live coverage; API returns 404. */
  sources: SourceName[];
}

export const ASSETS: AssetMeta[] = [
  { code: 'BTC',           kind: 'crypto',         label: 'Bitcoin',             sources: ['bitpin']   },
  { code: 'ETH',           kind: 'crypto',         label: 'Ethereum',            sources: ['bitpin']   },
  { code: 'USDT',          kind: 'crypto',         label: 'Tether',              sources: ['bitpin']   },
  { code: 'PAXG',          kind: 'tokenized_gold', label: 'PAX Gold',            sources: ['bitpin']   },
  { code: 'XAU',           kind: 'spot_metal',     label: 'Gold spot (USD/oz)',  sources: ['goldspot'] },
  { code: 'USD',           kind: 'fiat',           label: 'US Dollar',           sources: []           },
  { code: 'XAU_18K',       kind: 'physical_gold',  label: 'Gold 18k (gram)',     sources: []           },
  { code: 'XAU_24K',       kind: 'physical_gold',  label: 'Gold 24k (gram)',     sources: []           },
  { code: 'MESGHAL',       kind: 'physical_gold',  label: 'Mesghal',             sources: []           },
  { code: 'GRAM',          kind: 'physical_gold',  label: 'Gram',                sources: []           },
  { code: 'BAHAR_FULL',    kind: 'physical_coin',  label: 'Bahar Azadi Full',    sources: []           },
  { code: 'BAHAR_HALF',    kind: 'physical_coin',  label: 'Bahar Azadi Half',    sources: []           },
  { code: 'BAHAR_QUARTER', kind: 'physical_coin',  label: 'Bahar Azadi Quarter', sources: []           },
];

/** which Bitpin markets to read; key = `${currency1.code}_${currency2.code}` */
export const BITPIN_PAIRS: Record<string, { asset: AssetCode; currency: 'IRT' | 'USDT' }> = {
  BTC_IRT:  { asset: 'BTC',  currency: 'IRT'  },
  BTC_USDT: { asset: 'BTC',  currency: 'USDT' },
  ETH_IRT:  { asset: 'ETH',  currency: 'IRT'  },
  ETH_USDT: { asset: 'ETH',  currency: 'USDT' },
  USDT_IRT: { asset: 'USDT', currency: 'IRT'  },
  PAXG_IRT: { asset: 'PAXG', currency: 'IRT'  },
  PAXG_USDT:{ asset: 'PAXG', currency: 'USDT' },
};
