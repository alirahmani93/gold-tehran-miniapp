# محاسبه قیمت طلا و سکه تهران — Telegram Mini App

A Telegram Mini App (Next.js) that calculates Tehran gold & coin prices from two
live inputs — **world gold ounce (USD)** and **free-market USD→Toman** — and flags
coin **bubbles (حباب)** and cross-coin arbitrage.

## How it works

Everything derives from `base = ounceUsd × dollarToman`. All constants and
divisors come from the reference sheet and are internally consistent with the
physical constants (troy ounce = 31.1035 g, mesghal = 4.6083 g, coins are .900).

| Quantity | Formula |
| --- | --- |
| مظنه (4.608 g of 17k, the "705") | `base / 9.5742` |
| سکه تمام (full coin, intrinsic) | `base / 4.24927` |
| نیم‌سکه / ربع‌سکه (intrinsic) | full × (4.07/8.13) / (2.03/8.13) |
| مثقال ۱۸ عیار (750) | `base / 8.999` |
| هر گرم عیار k (per-mille) | `mazaneh / 4.6083 / 705 × k` |
| خرید: وزن از روی پول | `money / mazaneh × 4.6083 × 705 / k` |
| فروش: پول از روی وزن | `weight × mazaneh / 4.6083 / 705 × k` |
| حباب (bubble) | `marketPrice − intrinsic` |

The engine lives in [`lib/gold.ts`](lib/gold.ts) as pure functions; the UI in
[`app/page.tsx`](app/page.tsx).

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploy to Vercel

```bash
vercel        # preview
vercel --prod # production
```

Then register the production HTTPS URL in **@BotFather → Bot Settings → Menu Button**
(or via `setChatMenuButton`) as a Web App, so it opens inside Telegram with the
native theme applied.

## Status & next steps

- ✅ Calculator + live bubble/arbitrage display (this version — manual price input)
- ⬜ Auto price feed (ounce + USD + Tehran coin market) — likely via tgju.org
- ⬜ Monitoring backend: cron poller → Telegram push when a bubble crosses a threshold
