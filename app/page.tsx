import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowIcon,
  BoltIcon,
  BubbleIcon,
  ChartIcon,
  CoinIcon,
  GaugeIcon,
  GlobeIcon,
  RefreshIcon,
  ScaleIcon,
  ShieldIcon,
} from "./icons";

export const metadata: Metadata = {
  title: "محاسبه‌گر طلا و سکه تهران | حباب، مظنه و نسبت سکه به طلا",
  description:
    "محاسبهٔ لحظه‌ای قیمت طلا، سکه، مظنه و طلای آبشده بر اساس انس جهانی و دلار آزاد — به‌همراه تشخیص حباب و فرصت سود. مینی‌اپ تلگرام.",
  openGraph: {
    title: "محاسبه‌گر طلا و سکه تهران",
    description: "حباب، مظنه، نسبت سکه به طلا و فرصت سود — لحظه‌ای.",
    type: "website",
  },
};

const APP_URL = "/calculator";

/* ---------- content (honest; no fabricated metrics/testimonials) ---------- */
const FEATURES = [
  {
    Icon: GlobeIcon,
    title: "انس جهانی، زنده",
    body: "قیمت انس از منبع آنلاین به‌صورت خودکار گرفته می‌شود؛ با یک دکمه بروزرسانی کن.",
  },
  {
    Icon: BubbleIcon,
    title: "تشخیص حباب",
    body: "حباب سکه و طلای آبشده را نسبت به ارزش ذاتی (ذوب) لحظه‌ای محاسبه می‌کند.",
  },
  {
    Icon: GaugeIcon,
    title: "نسبت سکه به طلا",
    body: "نسبت رایج بازاری‌ها با بازه‌های تصمیم‌گیری: کِی بخر، کِی بفروش.",
  },
  {
    Icon: CoinIcon,
    title: "ارزش ذاتی سکه‌ها",
    body: "سکه تمام، نیم‌سکه و ربع‌سکه — ارزش واقعی طلای داخل هرکدام.",
  },
  {
    Icon: ScaleIcon,
    title: "تبدیل پول ↔ وزن",
    body: "با هر مبلغ چه وزنی طلا می‌خری، و هر وزن طلا چقدر می‌ارزد — با هر عیاری.",
  },
  {
    Icon: ChartIcon,
    title: "فرصت آربیتراژ",
    body: "مقایسهٔ حباب بین سکه‌ها و طلای آبشده برای یافتن بهترین سمت معامله.",
  },
];

const STEPS = [
  {
    n: "۱",
    title: "دو عدد را وارد کن",
    body: "انس جهانی (خودکار) و قیمت دلار آزاد. مبنای همهٔ محاسبات همین دو است.",
  },
  {
    n: "۲",
    title: "قیمت بازار را بده",
    body: "قیمت بازار سکه یا طلای آبشده را وارد کن تا حباب و نسبت‌ها حساب شود.",
  },
  {
    n: "۳",
    title: "تصمیم بگیر",
    body: "بازه‌های رنگی نشان می‌دهند حباب کم است یا زیاد، و کدام سمت بازار بهتر است.",
  },
];

const FAQ = [
  {
    q: "قیمت‌ها از کجا می‌آید؟",
    a: "انس جهانی به‌صورت خودکار از یک منبع آنلاین گرفته می‌شود. قیمت دلار آزاد و قیمت بازار سکه را خودت وارد می‌کنی تا محاسبه دقیق و مطابق بازار لحظه‌ای تو باشد.",
  },
  {
    q: "حباب دقیقاً یعنی چه؟",
    a: "حباب = قیمت بازار منهای ارزش ذاتی (ارزش ذوب طلای داخل سکه). حباب مثبت یعنی سکه گران‌تر از طلای داخلش است.",
  },
  {
    q: "اعداد آستانهٔ نسبت و حباب چقدر دقیق‌اند؟",
    a: "این بازه‌ها تجربی و تقریبی‌اند (مثل ۱۱٫۲ و ۱۲٫۴) و در شرایط مختلف بازار کمی جابه‌جا می‌شوند. ابزار راهنماست، نه توصیهٔ سرمایه‌گذاری.",
  },
  {
    q: "هزینه دارد؟",
    a: "خیر. یک ابزار شخصی و رایگان است که داخل تلگرام باز می‌شود.",
  },
];

function Glass({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl ${className}`}
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.45)" }}
    >
      {children}
    </div>
  );
}

function Cta({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const primary =
    "bg-gradient-to-l from-gold-500 to-gold-300 text-[#1a1205] shadow-[0_8px_24px_rgba(231,168,36,0.35)] hover:brightness-105";
  const ghost =
    "border border-white/15 text-gold-100 hover:bg-white/[0.06] backdrop-blur";
  return (
    <Link
      href={APP_URL}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-gold-300/70 ${
        variant === "primary" ? primary : ghost
      }`}
    >
      {children}
    </Link>
  );
}

export default function Landing() {
  return (
    <div id="main" dir="rtl" className="relative min-h-dvh overflow-hidden text-slate-100">
      {/* gold radial mesh background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, rgba(231,168,36,0.18), transparent 60%), radial-gradient(50% 40% at 10% 10%, rgba(123,97,255,0.10), transparent 55%), radial-gradient(80% 60% at 50% 110%, rgba(185,106,15,0.16), transparent 60%), #0b0d12",
        }}
      />

      {/* NAV */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 text-[#1a1205]">
            <CoinIcon width={20} height={20} />
          </span>
          <span className="text-sm font-extrabold text-gold-100">طلاسنج تهران</span>
        </div>
        <div className="hidden sm:block">
          <Cta variant="ghost">
            باز کردن محاسبه‌گر
            <ArrowIcon width={16} height={16} />
          </Cta>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-8 pt-10 md:grid-cols-2 md:pt-16">
        <div className="lp-rise" style={{ animationDelay: "60ms" }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-gold-300/10 px-3 py-1 text-xs font-bold text-gold-200">
            <BoltIcon width={14} height={14} />
            محاسبهٔ لحظه‌ای بازار طلا
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
            قیمت واقعی طلا و سکه را{" "}
            <span className="lp-shimmer">لحظه‌ای</span> بفهم
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            مظنه، ارزش ذاتی سکه، طلای آبشده و حباب بازار — همه از روی انس جهانی و
            دلار آزاد. ببین کجا حباب هست و کدام سمت معامله به سودت است.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Cta variant="primary">
              باز کردن محاسبه‌گر
              <ArrowIcon width={18} height={18} />
            </Cta>
            <a
              href="#features"
              className="inline-flex min-h-[48px] items-center rounded-2xl px-4 text-sm font-medium text-slate-300 outline-none transition hover:text-gold-100 focus-visible:ring-2 focus-visible:ring-gold-300/70"
            >
              امکانات را ببین
            </a>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldIcon width={14} height={14} />
            رایگان · داخل تلگرام باز می‌شود · بدون ثبت‌نام
          </p>
        </div>

        {/* hero visual — honest mock of the calculator output */}
        <div className="lp-rise" style={{ animationDelay: "180ms" }}>
          <div className="lp-float">
            <Glass className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">قیمت‌های محاسبه‌شده</span>
                <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-gold-200">
                  <RefreshIcon width={12} height={12} />
                  انس زنده
                </span>
              </div>
              <PreviewRow label="مظنه (مثقال ۱۷)" value="۲۴٬۱۲۷٬۳۴۲" strong />
              <PreviewRow label="هر گرم طلای ۱۸" value="۵٬۵۷۰٬۲۷۹" />
              <PreviewRow label="سکه تمام (ذاتی)" value="۵۴٬۳۶۲٬۲۷۹" strong />
              <PreviewRow label="هر گرم آبشده" value="۵٬۲۳۸٬۱۰۰" />
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-gold-300/20 bg-gold-300/[0.07] p-3">
                <span className="text-xs text-slate-300">نسبت سکه به طلا</span>
                <span className="num text-2xl font-extrabold text-gold-300">
                  ۱۱٫۴۷
                </span>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                نمونهٔ خروجی — اعداد واقعی به ورودی تو بستگی دارد
              </p>
            </Glass>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            هر چیزی که برای تصمیم لازم داری
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
            از قیمت‌گذاری پایه تا تشخیص حباب و آربیتراژ — یک‌جا و فارسی.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <Glass key={title} className="p-5 transition hover:border-gold-300/25">
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300/20 to-gold-600/10 text-gold-300">
                <Icon width={22} height={22} />
              </span>
              <h3 className="text-base font-bold text-slate-100">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{body}</p>
            </Glass>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-5 py-6 md:py-12">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-extrabold md:text-3xl">در سه قدم</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <Glass key={s.n} className="relative p-6">
              <span className="num absolute left-5 top-5 text-5xl font-black text-white/[0.06]">
                {s.n}
              </span>
              <h3 className="relative text-base font-bold text-gold-200">{s.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
                {s.body}
              </p>
            </Glass>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold md:text-3xl">سؤال‌های متداول</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur open:border-gold-300/20"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-100">
                {f.q}
                <span className="text-gold-300 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <Glass className="overflow-hidden p-8 text-center md:p-12">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            همین حالا حباب بازار را بسنج
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            دو عدد وارد کن و در چند ثانیه ببین طلا یا سکه به‌صرفه است یا نه.
          </p>
          <div className="mt-7 flex justify-center">
            <Cta variant="primary">
              باز کردن محاسبه‌گر
              <ArrowIcon width={18} height={18} />
            </Cta>
          </div>
        </Glass>
      </section>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        طلاسنج تهران — ابزار راهنما، نه توصیهٔ سرمایه‌گذاری.
      </footer>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`num text-sm ${strong ? "font-bold text-gold-300" : "text-slate-200"}`}>
        {value}
        <span className="mr-1 text-[10px] text-slate-500"> تومان</span>
      </span>
    </div>
  );
}
