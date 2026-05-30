"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  arbitrage,
  buyWeight,
  cleanNumInput,
  coinBubbles,
  coinGoldRatio,
  derive,
  fmtNum,
  fmtToman,
  groupDigits,
  gramOfKarat,
  parseNum,
  ratioBand,
  bubbleBand,
  RATIO_BANDS,
  EMAMI_18K_GRAMS,
  sellPrice,
  bubble,
  type Band,
  type Bubble,
  type CoinKey,
  type Tone,
} from "@/lib/gold";

/* ---------- Telegram WebApp glue ---------- */
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        colorScheme?: "light" | "dark";
        themeParams?: Record<string, string>;
        setHeaderColor?: (c: string) => void;
      };
    };
  }
}

function useTelegramTheme() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    const t = tg.themeParams;
    if (t && Object.keys(t).length) {
      const r = document.documentElement.style;
      if (t.bg_color) r.setProperty("--bg", t.bg_color);
      if (t.secondary_bg_color) {
        r.setProperty("--card", t.secondary_bg_color);
        r.setProperty("--card-2", t.secondary_bg_color);
      }
      if (t.text_color) r.setProperty("--text", t.text_color);
      if (t.hint_color) r.setProperty("--muted", t.hint_color);
      if (t.section_separator_color)
        r.setProperty("--border", t.section_separator_color);
    }
    tg.setHeaderColor?.("#0f1115");
  }, []);
}

/* ---------- info popover (small dialog near the field) ---------- */
function Info({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="راهنما"
        onClick={() => setOpen((v) => !v)}
        className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none"
        style={{
          background: open ? "var(--gold-500,#d68a14)" : "var(--card-2)",
          color: open ? "#1a1205" : "var(--muted)",
          border: "1px solid var(--border)",
        }}
      >
        i
      </button>
      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: "transparent", cursor: "default" }}
          />
          <div
            role="dialog"
            className="absolute z-50 w-56 rounded-xl p-3 text-[11px] leading-relaxed shadow-xl"
            style={{
              top: "150%",
              right: 0,
              background: "var(--card-2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            {text}
          </div>
        </>
      )}
    </span>
  );
}

/* ---------- small UI atoms ---------- */
function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-4 mb-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {title && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gold-300">{title}</h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function NumField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  info,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
  info?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
        {label}
        {info && <Info text={info} />}
      </span>
      <div
        className="mt-1 flex items-center rounded-xl px-3"
        style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}
      >
        <input
          type="text"
          inputMode="decimal"
          value={groupDigits(value)}
          placeholder={placeholder}
          onChange={(e) => onChange(cleanNumInput(e.target.value))}
          className="num w-full bg-transparent py-2.5 text-base outline-none"
          style={{ color: "var(--text)" }}
        />
        {suffix && (
          <span className="text-xs whitespace-nowrap pr-2" style={{ color: "var(--muted)" }}>
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Row({
  label,
  value,
  strong,
  info,
}: {
  label: string;
  value: string;
  strong?: boolean;
  info?: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-2"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span className="flex items-center gap-1 text-sm" style={{ color: "var(--muted)" }}>
        {label}
        {info && <Info text={info} />}
      </span>
      <span className={`num text-sm ${strong ? "font-bold text-gold-300" : ""}`}>
        {value}
        <span className="text-xs mr-1" style={{ color: "var(--muted)" }}>
          {" "}
          تومان
        </span>
      </span>
    </div>
  );
}

const KARATS = [
  { label: "۲۴ (۹۹۵)", v: 995 },
  { label: "۲۲ (۹۱۶)", v: 916 },
  { label: "۲۱ (۸۷۵)", v: 875 },
  { label: "۱۸ (۷۵۰)", v: 750 },
  { label: "۱۷ (۷۰۵)", v: 705 },
];

const COIN_LABEL: Record<CoinKey, string> = {
  full: "سکه تمام",
  half: "نیم‌سکه",
  quarter: "ربع‌سکه",
};

/* ---------- field help texts ---------- */
const HELP = {
  ounce:
    "قیمت هر اونس (۳۱٫۱۰۳۵ گرم) طلای خالص در بازار جهانی، به دلار. مبنای تمام محاسبات است و با دکمهٔ بروزرسانی از منبع آنلاین گرفته می‌شود.",
  dollar:
    "قیمت دلار آزاد به تومان. همراه با انس جهانی، دو ورودی اصلی محاسبه هستند. این مقدار را دستی وارد کنید.",
  mazaneh:
    "مظنه: قیمت یک مثقال (۴٫۶۰۸ گرم) طلای ۱۷ عیار (۷۰۵). فرمول: انس × دلار ÷ ۹٫۵۷۴۲",
  mesghal18: "قیمت یک مثقال (۴٫۶۰۸ گرم) طلای ۱۸ عیار (۷۵۰). فرمول: انس × دلار ÷ ۸٫۹۹۹",
  gram18: "قیمت هر گرم طلای ۱۸ عیار. فرمول: مثقال ۱۸ ÷ ۴٫۶۰۸",
  gram24: "قیمت هر گرم طلای ۲۴ عیار (۹۹۵)، محاسبه‌شده از مظنه و عیار.",
  full: "ارزش ذاتی (ذوب) سکهٔ تمام بهار آزادی. فرمول: انس × دلار ÷ ۴٫۲۴۹۲۷",
  half: "ارزش ذاتی نیم‌سکه = ارزش ذاتی سکهٔ تمام × (۴٫۰۷ ÷ ۸٫۱۳)",
  quarter: "ارزش ذاتی ربع‌سکه = ارزش ذاتی سکهٔ تمام × (۲٫۰۳ ÷ ۸٫۱۳)",
  meltedMesghal: "طلای آبشده ۱۷ عیار (۷۰۵). قیمت هر مثقال (۴٫۶۰۸ گرم) برابر مظنه است.",
  meltedGram: "قیمت هر گرم طلای آبشده ۱۷ عیار. فرمول: مظنه ÷ ۴٫۶۰۸",
  karat: "قیمت هر گرم طلا با عیار انتخابی، از روی مظنه. فرمول: مظنه ÷ ۴٫۶۰۸ ÷ ۷۰۵ × عیار",
  buy: "با مبلغ واردشده چه وزنی طلا (با عیار انتخابی) می‌توان خرید. فرمول: پول ÷ مظنه × ۴٫۶۰۸ × ۷۰۵ ÷ عیار",
  sell: "این وزن طلا (با عیار انتخابی) هنگام فروش چقدر می‌ارزد. فرمول: وزن × مظنه ÷ ۴٫۶۰۸ ÷ ۷۰۵ × عیار",
  bubble: "حباب = قیمت بازار منهای ارزش ذاتی. مثبت یعنی گران‌تر از ارزش واقعی طلای داخل آن.",
  meltedBubble: "حباب طلای آبشده = قیمت بازار هر گرم منهای ارزش ذاتی هر گرم آبشده.",
  ratio:
    "نسبت سکه به طلا = قیمت بازار سکه امامی ÷ قیمت هر گرم طلای ۱۸ عیار. روش رایج بازاری‌ها برای سنجش حباب سکه. (از قیمت سکه تمام که در بخش حباب وارد کرده‌اید استفاده می‌شود.)",
  ratioBands:
    "بازه‌های تجربی: زیر ۱۱٫۲ حباب خیلی کم (سکه بخر)، ۱۱٫۲ تا ۱۱٫۸ متعادل، بالای ۱۲ تا ۱۲٫۴ حباب زیاد، بالای ۱۲٫۴ حباب خیلی زیاد (سکه بفروش). این اعداد تقریبی‌اند و گاهی کمی جابه‌جا می‌شوند.",
  emamiEq:
    "سکه امامی ۸٫۱۳۳ گرم طلای ۹۰۰ (۲۲ عیار) دارد که معادل ≈ ۹٫۷۶ گرم طلای ۱۸ عیار است. ارزش ذاتی ≈ قیمت گرم ۱۸ × ۹٫۷۶ (به‌علاوهٔ هزینهٔ ضرب).",
} as const;

const TONE_COLOR: Record<Tone, { bg: string; fg: string }> = {
  buy: { bg: "rgba(34,197,94,0.14)", fg: "#4ade80" },
  neutral: { bg: "rgba(148,163,184,0.14)", fg: "#cbd5e1" },
  caution: { bg: "rgba(234,179,8,0.16)", fg: "#fbbf24" },
  sell: { bg: "rgba(239,68,68,0.14)", fg: "#f87171" },
};

function BandBadge({ band }: { band: Band }) {
  const c = TONE_COLOR[band.tone];
  return (
    <div
      className="rounded-xl p-3 text-sm"
      style={{ background: c.bg, border: `1px solid ${c.fg}33` }}
    >
      <div className="font-bold" style={{ color: c.fg }}>
        {band.label}
      </div>
      <div className="mt-0.5 text-xs" style={{ color: "var(--text)" }}>
        ← {band.action}
      </div>
    </div>
  );
}

function BubblePill({ b }: { b: Bubble | null }) {
  if (!b) return <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>;
  const pos = b.toman >= 0;
  return (
    <span
      className="num inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold"
      style={{
        background: pos ? "rgba(239,68,68,0.14)" : "rgba(34,197,94,0.14)",
        color: pos ? "#f87171" : "#4ade80",
      }}
    >
      {pos ? "+" : ""}
      {fmtToman(b.toman)} ({fmtNum(b.pct, 1)}٪)
    </span>
  );
}

interface OunceMeta {
  loading: boolean;
  source?: string;
  updatedAt?: string;
  error?: string | null;
}

export default function Page() {
  useTelegramTheme();

  // primary inputs (raw digit strings, no separators)
  const [ounce, setOunce] = useState("3300");
  const [dollar, setDollar] = useState("70000");
  const [meta, setMeta] = useState<OunceMeta>({ loading: false });

  // karat + money tools
  const [karat, setKarat] = useState(750);
  const [money, setMoney] = useState("");
  const [weight, setWeight] = useState("");

  // market prices (for bubble)
  const [mFull, setMFull] = useState("");
  const [mHalf, setMHalf] = useState("");
  const [mQuarter, setMQuarter] = useState("");
  const [mMelted, setMMelted] = useState(""); // melted gold market price per gram

  const loadOunce = useCallback(async () => {
    setMeta((m) => ({ ...m, loading: true, error: null }));
    try {
      const r = await fetch("/api/ounce", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok && isFinite(Number(j.price))) {
        setOunce(cleanNumInput(String(j.price)));
        setMeta({ loading: false, source: j.source, updatedAt: j.updatedAt, error: null });
      } else {
        setMeta((m) => ({ ...m, loading: false, error: j?.error || "خطا در دریافت قیمت" }));
      }
    } catch {
      setMeta((m) => ({ ...m, loading: false, error: "عدم اتصال به منبع قیمت" }));
    }
  }, []);

  // auto-fetch the world ounce price once on load
  useEffect(() => {
    loadOunce();
  }, [loadOunce]);

  const inputs = useMemo(
    () => ({ ounceUsd: parseNum(ounce), dollarToman: parseNum(dollar) }),
    [ounce, dollar],
  );
  const d = useMemo(() => derive(inputs), [inputs]);

  const gramK = useMemo(() => gramOfKarat(d.mazaneh17, karat), [d.mazaneh17, karat]);
  const boughtWeight = useMemo(
    () => (money ? buyWeight(parseNum(money), d.mazaneh17, karat) : 0),
    [money, d.mazaneh17, karat],
  );
  const soldPrice = useMemo(
    () => (weight ? sellPrice(parseNum(weight), d.mazaneh17, karat) : 0),
    [weight, d.mazaneh17, karat],
  );

  const market = {
    full: parseNum(mFull) || undefined,
    half: parseNum(mHalf) || undefined,
    quarter: parseNum(mQuarter) || undefined,
  };
  const bubbles = useMemo(() => coinBubbles(d, market), [d, mFull, mHalf, mQuarter]);
  const arb = useMemo(() => arbitrage(bubbles, market), [bubbles, mFull, mHalf, mQuarter]);
  const meltedBubble = useMemo(
    () => bubble(parseNum(mMelted), d.meltedGram),
    [mMelted, d.meltedGram],
  );

  // نسبت سکه به طلا — uses the Emami (full coin) market price + derived gram18
  const ratio = useMemo(
    () => coinGoldRatio(parseNum(mFull), d.gram18),
    [mFull, d.gram18],
  );
  const fullBubble = bubbles.full;

  const hasAnyMarket = !!(market.full || market.half || market.quarter);

  return (
    <main className="mx-auto max-w-md px-4 py-5">
      <header className="mb-5 text-center">
        <h1 className="text-xl font-extrabold text-gold-300">محاسبه قیمت طلا و سکه</h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          بر اساس انس جهانی و دلار آزاد — تهران
        </p>
      </header>

      {/* INPUTS */}
      <Card
        title="ورودی‌ها"
        subtitle="دو عدد پایه؛ باقی همه چیز از این‌ها محاسبه می‌شود"
        right={
          <button
            type="button"
            onClick={loadOunce}
            disabled={meta.loading}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold"
            style={{
              background: "var(--card-2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              opacity: meta.loading ? 0.6 : 1,
            }}
          >
            <span style={{ display: "inline-block" }} className={meta.loading ? "animate-spin" : ""}>
              ⟳
            </span>
            {meta.loading ? "در حال دریافت…" : "بروزرسانی انس"}
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <NumField label="انس جهانی طلا" value={ounce} onChange={setOunce} suffix="دلار" info={HELP.ounce} />
          <NumField label="قیمت دلار" value={dollar} onChange={setDollar} suffix="تومان" info={HELP.dollar} />
        </div>
        <p className="mt-2 text-[11px]" style={{ color: meta.error ? "#f87171" : "var(--muted)" }}>
          {meta.error
            ? `⚠️ ${meta.error} — مقدار فعلی دستی است`
            : meta.source
              ? `انس از ${meta.source} دریافت شد${meta.updatedAt ? ` — ${meta.updatedAt}` : ""}`
              : "انس جهانی هنگام باز شدن برنامه به‌صورت خودکار گرفته می‌شود"}
        </p>
      </Card>

      {/* DERIVED PRICES */}
      <Card title="قیمت‌های محاسبه‌شده">
        <Row label="مظنه (مثقال ۱۷ عیار)" value={fmtToman(d.mazaneh17)} strong info={HELP.mazaneh} />
        <Row label="مثقال ۱۸ عیار (۷۵۰)" value={fmtToman(d.mesghal18)} info={HELP.mesghal18} />
        <Row label="هر گرم طلای ۱۸ عیار" value={fmtToman(d.gram18)} strong info={HELP.gram18} />
        <Row label="هر گرم طلای ۲۴ عیار (۹۹۵)" value={fmtToman(d.gram24)} info={HELP.gram24} />
        <Row label="سکه تمام (ذاتی)" value={fmtToman(d.fullCoin)} strong info={HELP.full} />
        <Row label="نیم‌سکه (ذاتی)" value={fmtToman(d.halfCoin)} info={HELP.half} />
        <Row label="ربع‌سکه (ذاتی)" value={fmtToman(d.quarterCoin)} info={HELP.quarter} />
      </Card>

      {/* MELTED GOLD — طلای آبشده */}
      <Card title="طلای آبشده" subtitle="۱۷ عیار (۷۰۵)">
        <Row label="هر مثقال آبشده (۴.۶۰۸ گرم)" value={fmtToman(d.meltedMesghal)} strong info={HELP.meltedMesghal} />
        <Row label="هر گرم آبشده" value={fmtToman(d.meltedGram)} strong info={HELP.meltedGram} />
        <div className="mt-3">
          <NumField
            label="قیمت بازار هر گرم آبشده"
            value={mMelted}
            onChange={setMMelted}
            suffix="تومان"
            placeholder="قیمت بازار"
            info={HELP.meltedBubble}
          />
          {meltedBubble && (
            <div className="mt-1.5 flex items-center justify-between">
              <span className="num text-xs" style={{ color: "var(--muted)" }}>
                ذاتی: {fmtToman(meltedBubble.intrinsic)}
              </span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                حباب: <BubblePill b={meltedBubble} />
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* KARAT */}
      <Card title="قیمت هر گرم بر اساس عیار">
        <div className="flex flex-wrap gap-2 mb-3">
          {KARATS.map((k) => (
            <button
              key={k.v}
              onClick={() => setKarat(k.v)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition"
              style={{
                background: karat === k.v ? "var(--gold-500, #d68a14)" : "var(--card-2)",
                color: karat === k.v ? "#1a1205" : "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
        <Row label={`هر گرم طلای ${karat}`} value={fmtToman(gramK)} strong info={HELP.karat} />
      </Card>

      {/* BUY / SELL */}
      <Card title="تبدیل پول ↔ وزن" subtitle={`عیار انتخاب‌شده: ${karat}`}>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <NumField
              label="با این مبلغ چقدر طلا می‌خرم؟"
              value={money}
              onChange={setMoney}
              suffix="تومان"
              placeholder="مبلغ پول"
              info={HELP.buy}
            />
            {money && (
              <p className="num mt-2 text-sm font-bold text-gold-300">
                ≈ {fmtNum(boughtWeight, 3)} گرم
              </p>
            )}
          </div>
          <div>
            <NumField
              label="این مقدار طلا چقدر می‌ارزد؟"
              value={weight}
              onChange={setWeight}
              suffix="گرم"
              placeholder="وزن به گرم"
              info={HELP.sell}
            />
            {weight && (
              <p className="num mt-2 text-sm font-bold text-gold-300">
                ≈ {fmtToman(soldPrice)} تومان
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* BUBBLE / ARBITRAGE */}
      <Card
        title="حباب و فرصت سود"
        subtitle="قیمت بازار سکه را وارد کن تا حباب (اختلاف با ارزش ذاتی) محاسبه شود"
      >
        <div className="grid grid-cols-1 gap-3">
          <BubbleInput label="قیمت بازار سکه تمام" value={mFull} onChange={setMFull} b={bubbles.full} info={HELP.bubble} />
          <BubbleInput label="قیمت بازار نیم‌سکه" value={mHalf} onChange={setMHalf} b={bubbles.half} info={HELP.bubble} />
          <BubbleInput label="قیمت بازار ربع‌سکه" value={mQuarter} onChange={setMQuarter} b={bubbles.quarter} info={HELP.bubble} />
        </div>

        {hasAnyMarket && (
          <div
            className="mt-4 rounded-xl p-3 text-sm"
            style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-xs font-bold mb-2 text-gold-300">تحلیل</h3>
            {arb.cheapest && (
              <p className="mb-1">
                ✅ کم‌ترین حباب: <b className="text-green-400">{COIN_LABEL[arb.cheapest]}</b> — بهترین گزینه برای خرید
              </p>
            )}
            {arb.priciest && arb.priciest !== arb.cheapest && (
              <p className="mb-1">
                ⚠️ بیش‌ترین حباب: <b className="text-red-400">{COIN_LABEL[arb.priciest]}</b> — گران‌ترین، مناسب فروش
              </p>
            )}
            {typeof arb.spreadPct === "number" && (
              <p className="num mb-1" style={{ color: "var(--muted)" }}>
                اختلاف حباب بین سکه‌ها: {fmtNum(arb.spreadPct, 1)} واحد درصد
              </p>
            )}
            {typeof arb.twoHalvesVsFull === "number" && (
              <p className="num mb-1" style={{ color: "var(--muted)" }}>
                ۲ نیم‌سکه در برابر ۱ سکه تمام: {arb.twoHalvesVsFull >= 0 ? "+" : ""}
                {fmtNum(arb.twoHalvesVsFull, 1)}٪
              </p>
            )}
            {typeof arb.fourQuartersVsFull === "number" && (
              <p className="num" style={{ color: "var(--muted)" }}>
                ۴ ربع‌سکه در برابر ۱ سکه تمام: {arb.fourQuartersVsFull >= 0 ? "+" : ""}
                {fmtNum(arb.fourQuartersVsFull, 1)}٪
              </p>
            )}
          </div>
        )}
      </Card>

      {/* COIN/GOLD RATIO — نسبت سکه به طلا */}
      <Card
        title="نسبت سکه به طلا"
        subtitle="روش رایج بازاری‌ها برای سنجش حباب سکهٔ امامی"
      >
        {ratio === null ? (
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            برای محاسبه، قیمت بازار «سکه تمام» را در بخش «حباب و فرصت سود» وارد کنید.
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between mb-3">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                نسبت فعلی
                <Info text={HELP.ratio} />
              </span>
              <span className="num text-3xl font-extrabold text-gold-300">
                {fmtNum(ratio, 2)}
              </span>
            </div>
            <BandBadge band={ratioBand(ratio)} />

            {/* threshold scale */}
            <div className="mt-3">
              <RatioScale ratio={ratio} />
            </div>

            <div
              className="mt-3 grid grid-cols-2 gap-2 text-[11px]"
              style={{ color: "var(--muted)" }}
            >
              <span className="flex items-center gap-1">
                مبنا
                <Info text={HELP.emamiEq} />
                : ۱ سکه ≈ {fmtNum(EMAMI_18K_GRAMS, 2)} گرم طلای ۱۸
              </span>
              <span className="num">
                = قیمت سکه ÷ گرم ۱۸ ({fmtToman(d.gram18)})
              </span>
            </div>
          </>
        )}

        {/* absolute Toman-bubble decision bands for the full coin */}
        {fullBubble && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                وضعیت حباب سکه (تومانی)
                <Info text={HELP.ratioBands} />
              </span>
              <span className="text-xs">
                حباب: <BubblePill b={fullBubble} />
              </span>
            </div>
            <BandBadge band={bubbleBand(fullBubble.toman)} />
          </div>
        )}
      </Card>

      <p className="text-center text-xs leading-relaxed mt-2" style={{ color: "var(--muted)" }}>
        ارزش ذاتی = ارزش ذوب طلای داخل سکه/آبشده از روی انس و دلار. حباب = قیمت بازار منهای ارزش ذاتی.
        انس به‌صورت خودکار از اینترنت گرفته می‌شود؛ قیمت دلار و قیمت بازار سکه را دستی وارد کنید.
        اعداد آستانهٔ نسبت و حباب تقریبی و تجربی‌اند.
      </p>
    </main>
  );
}

/** Visual position of the current ratio along the band thresholds. */
function RatioScale({ ratio }: { ratio: number }) {
  const lo = 10.5;
  const hi = 13.0;
  const clamp = Math.max(lo, Math.min(hi, ratio));
  const pct = ((clamp - lo) / (hi - lo)) * 100;
  const mark = (v: number) => ((v - lo) / (hi - lo)) * 100;
  return (
    <div>
      <div
        className="relative h-2 rounded-full"
        style={{
          background:
            "linear-gradient(90deg,#4ade80 0%,#cbd5e1 35%,#fbbf24 70%,#f87171 100%)",
        }}
      >
        {[RATIO_BANDS.low, RATIO_BANDS.mid, RATIO_BANDS.high].map((v) => (
          <span
            key={v}
            className="absolute top-1/2 h-3 w-px -translate-y-1/2"
            style={{ left: `${mark(v)}%`, background: "var(--bg)" }}
          />
        ))}
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${pct}%`, background: "#fff", borderColor: "var(--bg)" }}
        />
      </div>
      <div
        className="num mt-1 flex justify-between text-[10px]"
        style={{ color: "var(--muted)" }}
      >
        <span>۱۰٫۵</span>
        <span>{RATIO_BANDS.low}</span>
        <span>{RATIO_BANDS.high}</span>
        <span>۱۳</span>
      </div>
    </div>
  );
}

function BubbleInput({
  label,
  value,
  onChange,
  b,
  info,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  b: Bubble | null;
  info?: string;
}) {
  return (
    <div>
      <NumField label={label} value={value} onChange={onChange} suffix="تومان" placeholder="قیمت بازار" info={info} />
      {b && (
        <div className="mt-1.5 flex items-center justify-between">
          <span className="num text-xs" style={{ color: "var(--muted)" }}>
            ذاتی: {fmtToman(b.intrinsic)}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            حباب: <BubblePill b={b} />
          </span>
        </div>
      )}
    </div>
  );
}
