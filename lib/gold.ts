/**
 * Tehran gold & coin price engine.
 *
 * Everything derives from two live inputs:
 *   - ounceUsd:     world gold price, USD per troy ounce
 *   - dollarToman:  free-market USD price, in Toman
 *
 * All formulas and constants come straight from the user's reference sheet and
 * are internally consistent with the physical constants (troy ounce = 31.1035 g,
 * mesghal = 4.6083 g, coins are .900 fineness). See README for the derivation.
 *
 * Output prices are in Toman.
 */

export const C = {
  OUNCE_G: 31.1035, // grams per troy ounce
  MESGHAL_G: 4.6083, // grams per mesghal (sheet rounds to 4.61)
  // Coin gram weights, .900 fineness (from the sheet)
  FULL_W: 8.13,
  HALF_W: 4.07,
  QUARTER_W: 2.03,
  COIN_PURITY: 0.9,
  // The "705" reference: 17-karat expressed per-mille
  REF_705: 705,
  // Divisors given on the reference sheet
  FULL_DIV: 4.24927, // full coin = ounce*dollar / 4.24927
  MAZANEH_DIV: 9.5742, // mazaneh (4.608 g of 17k) = ounce*dollar / 9.5742
  GOLD18_DIV: 8.999, // one mesghal of 18k (750) = ounce*dollar / 8.999
} as const;

export interface Inputs {
  ounceUsd: number;
  dollarToman: number;
}

export interface Derived {
  base: number; // ounceUsd * dollarToman
  mazaneh17: number; // مظنه: price of 4.608 g of 17k (the "705" reference)
  mesghal18: number; // one mesghal (4.608 g) of 18k (750) gold
  gram18: number; // one gram of 18k (750) gold
  gram24: number; // one gram of pure (995/24k) gold
  fullCoin: number; // سکه تمام — intrinsic (melt) value
  halfCoin: number; // نیم‌سکه — intrinsic
  quarterCoin: number; // ربع‌سکه — intrinsic
  meltedMesghal: number; // طلای آبشده — one mesghal (4.608 g) of 17k = مظنه
  meltedGram: number; // طلای آبشده — one gram of 17k (705)
}

/** Core derivation from the two live inputs. */
export function derive({ ounceUsd, dollarToman }: Inputs): Derived {
  const base = ounceUsd * dollarToman;
  const fullCoin = base / C.FULL_DIV;
  return {
    base,
    mazaneh17: base / C.MAZANEH_DIV,
    mesghal18: base / C.GOLD18_DIV,
    gram18: base / C.GOLD18_DIV / C.MESGHAL_G,
    // gram of any karat = mazaneh / 4.608 / 705 * karat_per_mille
    gram24: gramOfKarat(base / C.MAZANEH_DIV, 995),
    fullCoin,
    // half & quarter share the .900 purity, so intrinsic scales by gram weight
    halfCoin: fullCoin * (C.HALF_W / C.FULL_W),
    quarterCoin: fullCoin * (C.QUARTER_W / C.FULL_W),
    // طلای آبشده is 17k (705): one mesghal == مظنه; per-gram divides by 4.6083
    meltedMesghal: base / C.MAZANEH_DIV,
    meltedGram: gramOfKarat(base / C.MAZANEH_DIV, C.REF_705),
  };
}

/** Price of one gram of gold at any karat (per-mille, e.g. 750, 900, 995). */
export function gramOfKarat(mazaneh17: number, karatPerMille: number): number {
  return (mazaneh17 / C.MESGHAL_G / C.REF_705) * karatPerMille;
}

/**
 * Weight (grams) you can buy with a given amount of money at a given karat.
 * money / mazaneh * 4.608 * 705 / karat
 */
export function buyWeight(
  money: number,
  mazaneh17: number,
  karatPerMille: number,
): number {
  return ((money / mazaneh17) * C.MESGHAL_G * C.REF_705) / karatPerMille;
}

/**
 * Money you receive when selling a given weight (grams) at a given karat.
 * weight * mazaneh / 4.608 / 705 * karat
 */
export function sellPrice(
  weight: number,
  mazaneh17: number,
  karatPerMille: number,
): number {
  return (((weight * mazaneh17) / C.MESGHAL_G / C.REF_705) * karatPerMille);
}

export interface Bubble {
  market: number; // entered market price
  intrinsic: number; // derived melt value
  toman: number; // market - intrinsic
  pct: number; // bubble as % of intrinsic
}

/** Bubble (حباب) = how much the market price exceeds intrinsic melt value. */
export function bubble(market: number, intrinsic: number): Bubble | null {
  if (!market || !intrinsic) return null;
  const toman = market - intrinsic;
  return { market, intrinsic, toman, pct: (toman / intrinsic) * 100 };
}

export type CoinKey = "full" | "half" | "quarter";

export interface CoinBubbles {
  full: Bubble | null;
  half: Bubble | null;
  quarter: Bubble | null;
}

export interface ArbSignal {
  /** Coin with the lowest bubble% — cheapest gold per Toman, best to BUY. */
  cheapest?: CoinKey;
  /** Coin with the highest bubble% — most overpriced, best to SELL. */
  priciest?: CoinKey;
  /** Spread between priciest and cheapest bubble%, in percentage points. */
  spreadPct?: number;
  /**
   * Half/quarter "fragmentation" arbitrage: how the price of 2 halves or
   * 4 quarters compares to one full coin (positive = fractions cost a premium).
   */
  twoHalvesVsFull?: number;
  fourQuartersVsFull?: number;
}

/** Compute bubbles for each coin from entered market prices + derived intrinsics. */
export function coinBubbles(
  d: Derived,
  market: { full?: number; half?: number; quarter?: number },
): CoinBubbles {
  return {
    full: bubble(market.full ?? 0, d.fullCoin),
    half: bubble(market.half ?? 0, d.halfCoin),
    quarter: bubble(market.quarter ?? 0, d.quarterCoin),
  };
}

/** Derive buy/sell + fragmentation signals from coin bubbles and market prices. */
export function arbitrage(
  b: CoinBubbles,
  market: { full?: number; half?: number; quarter?: number },
): ArbSignal {
  const entries = (
    [
      ["full", b.full],
      ["half", b.half],
      ["quarter", b.quarter],
    ] as [CoinKey, Bubble | null][]
  ).filter((e): e is [CoinKey, Bubble] => e[1] !== null);

  const out: ArbSignal = {};
  if (entries.length >= 2) {
    const sorted = [...entries].sort((a, z) => a[1].pct - z[1].pct);
    out.cheapest = sorted[0][0];
    out.priciest = sorted[sorted.length - 1][0];
    out.spreadPct = sorted[sorted.length - 1][1].pct - sorted[0][1].pct;
  }
  if (market.full && market.half) {
    out.twoHalvesVsFull = ((2 * market.half - market.full) / market.full) * 100;
  }
  if (market.full && market.quarter) {
    out.fourQuartersVsFull =
      ((4 * market.quarter - market.full) / market.full) * 100;
  }
  return out;
}

/** Toman formatting with thousands separators. */
export function fmtToman(n: number, fractionDigits = 0): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function fmtNum(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/* ---------- input helpers (thousand-separated number fields) ---------- */

const FA_DIGITS: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

/** Persian/Arabic digits → ASCII, and strip grouping separators. */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (c) => FA_DIGITS[c] ?? c)
    .replace(/[٬,،\s]/g, "");
}

/** Raw numeric string (no separators) kept in state, parsed NaN-safe → 0. */
export function parseNum(s: string): number {
  const n = Number(normalizeDigits(s).replace(/[^0-9.]/g, ""));
  return isFinite(n) ? n : 0;
}

/** Keep only digits and a single decimal point — what we store in state. */
export function cleanNumInput(s: string): string {
  const cleaned = normalizeDigits(s).replace(/[^0-9.]/g, "");
  const i = cleaned.indexOf(".");
  if (i === -1) return cleaned;
  // collapse any extra dots after the first
  return cleaned.slice(0, i + 1) + cleaned.slice(i + 1).replace(/\./g, "");
}

/** Group the integer part with thousands separators for display, preserving an
 *  in-progress decimal tail (so "12345." and "12345.0" stay editable). */
export function groupDigits(raw: string): string {
  const cleaned = cleanNumInput(raw);
  if (cleaned === "") return "";
  const [intPart, dec] = cleaned.split(".");
  const grouped = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return cleaned.includes(".") ? `${grouped}.${dec ?? ""}` : grouped;
}

/* ---------- coin/gold ratio + decision bands (نسبت سکه به طلا) ---------- */

/** Emami coin (8.13 g, .900) expressed as grams of 18k (750) gold ≈ 9.76. */
export const EMAMI_18K_GRAMS = (C.FULL_W * C.COIN_PURITY) / 0.75;

/** Bazaar coin/gold ratio thresholds. Tunable; defaults are the common ones. */
export const RATIO_BANDS = { low: 11.2, mid: 11.8, high: 12.4 } as const;

/** Absolute Toman bubble thresholds (calibrated for current price levels). */
export const BUBBLE_BANDS = {
  zero: 0,
  normalLow: 3_000_000,
  normalHigh: 8_000_000,
  high: 15_000_000,
} as const;

export type Tone = "buy" | "neutral" | "caution" | "sell";

export interface Band {
  label: string; // وضعیت / تفسیر
  action: string; // اقدام پیشنهادی
  tone: Tone;
}

/**
 * نسبت سکه به طلا = قیمت بازار سکه امامی ÷ قیمت هر گرم طلای ۱۸ عیار.
 * Both in the same unit, so the ratio is unitless (millions cancel).
 */
export function coinGoldRatio(coinMarket: number, gram18: number): number | null {
  if (!coinMarket || !gram18) return null;
  return coinMarket / gram18;
}

export function ratioBand(r: number): Band {
  if (r < RATIO_BANDS.low)
    return {
      label: "حباب سکه خیلی کم / مناسب",
      action: "سکه بخر + طلای آب‌شده بفروش",
      tone: "buy",
    };
  if (r < RATIO_BANDS.mid)
    return {
      label: "محدوده متعادل / عادی",
      action: "بسته به روند بازار، محتاط باش",
      tone: "neutral",
    };
  if (r < RATIO_BANDS.high)
    return {
      label: "حباب سکه زیاد",
      action: "مراقب باش، ممکنه فروش سکه خوب باشه",
      tone: "caution",
    };
  return {
    label: "حباب خیلی زیاد",
    action: "سکه بفروش + طلای آب‌شده بخر",
    tone: "sell",
  };
}

export function bubbleBand(toman: number): Band {
  if (toman < BUBBLE_BANDS.zero)
    return { label: "حباب منفی — سکه ارزون‌تر از طلاش", action: "سکه بخر", tone: "buy" };
  if (toman <= BUBBLE_BANDS.normalLow)
    return { label: "حباب کم / متعادل", action: "خرید سکه خوب است", tone: "buy" };
  if (toman <= BUBBLE_BANDS.normalHigh)
    return { label: "حباب معمولی", action: "بسته به روند دلار", tone: "neutral" };
  if (toman <= BUBBLE_BANDS.high)
    return { label: "حباب زیاد", action: "احتیاط / فروش تدریجی", tone: "caution" };
  return { label: "حباب خیلی زیاد", action: "سکه بفروش + طلا بخر", tone: "sell" };
}

/** Alternative intrinsic via the 18k-equivalent method, plus optional minting fee. */
export function intrinsicVia18k(gram18: number, mintingCost = 0): number {
  return gram18 * EMAMI_18K_GRAMS + mintingCost;
}
