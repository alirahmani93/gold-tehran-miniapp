"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cleanNumInput,
  derive,
  fmtToman,
  parseNum,
} from "@/lib/gold";
import "./calc.css";
import { CurrencyCalc } from "./currency-calc";
import { GoldCalc } from "./gold-calc";
import { InflationCalc } from "./inflation-calc";
import { Icon } from "./parts";

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
    tg.setHeaderColor?.("#0e1014");
  }, []);
}

/* ---------- persisted shell state ---------- */
const LS_KEY = "goldsanj.v1";
type TabKey = "gold" | "fx" | "infl";
type Saved = { tab?: TabKey; ounce?: string; dollar?: string };

function loadSaved(): Saved {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}") as Saved;
  } catch {
    return {};
  }
}

export default function Page() {
  useTelegramTheme();

  const [tab, setTab] = useState<TabKey>("gold");
  const [ounce, setOunce] = useState("3300");
  const [dollar, setDollar] = useState("96250");
  const [refreshing, setRefreshing] = useState(false);
  const [ounceError, setOunceError] = useState<string | null>(null);
  const [dollarError, setDollarError] = useState<string | null>(null);

  // rehydrate persisted state (after mount, so SSR markup stays stable)
  useEffect(() => {
    const s = loadSaved();
    if (s.tab) setTab(s.tab);
    if (s.ounce) setOunce(s.ounce);
    if (s.dollar) setDollar(s.dollar);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEY, JSON.stringify({ tab, ounce, dollar }));
  }, [tab, ounce, dollar]);

  /* ---------- live data ---------- */
  const loadOunce = useCallback(async () => {
    try {
      const r = await fetch("/api/ounce", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok && isFinite(Number(j.price))) {
        setOunce(cleanNumInput(String(j.price)));
        setOunceError(null);
      } else {
        setOunceError(j?.error || "خطا در دریافت قیمت انس");
      }
    } catch {
      setOunceError("عدم اتصال به منبع قیمت انس");
    }
  }, []);

  const loadBitpin = useCallback(async () => {
    try {
      const r = await fetch("/api/bitpin", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok && isFinite(Number(j?.usdtIrt?.price))) {
        setDollar(cleanNumInput(String(Math.round(j.usdtIrt.price))));
        setDollarError(null);
      } else {
        setDollarError(j?.error || "خطا در دریافت قیمت دلار");
      }
    } catch {
      setDollarError("عدم اتصال به Bitpin");
    }
  }, []);

  const loadAll = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([loadOunce(), loadBitpin()]);
    setRefreshing(false);
  }, [loadBitpin, loadOunce, refreshing]);

  // auto-fetch once on mount
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- shared derivations (for inflation tab) ---------- */
  const derived = useMemo(
    () => derive({ ounceUsd: parseNum(ounce), dollarToman: parseNum(dollar) }),
    [ounce, dollar],
  );

  const tabs: { k: TabKey; t: string; ic: React.ReactNode }[] = [
    { k: "gold", t: "طلا و سکه", ic: Icon.coin },
    { k: "fx", t: "ارز", ic: Icon.cash },
    { k: "infl", t: "تورم", ic: Icon.fire },
  ];

  return (
    <div className="cv-body" id="main">
      <div className="viewport">
        <div className="panel">
          <div className="topbar">
            <div className="brand">
              <span className="mark">ط</span>
              <span>طلاسنج تهران</span>
            </div>
            <span className="live-chip">
              <span className="live-dot" />
              انس زنده · <span className="num">{fmtToman(parseNum(ounce))}</span>$
            </span>
          </div>

          <div className="seg" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.k}
                role="tab"
                aria-selected={tab === t.k}
                className={tab === t.k ? "on gold" : ""}
                onClick={() => setTab(t.k)}
              >
                {t.ic}
                {t.t}
              </button>
            ))}
          </div>

          <div className="scroll">
            {tab === "gold" && (
              <GoldCalc
                ounce={ounce}
                dollar={dollar}
                setOunce={setOunce}
                setDollar={setDollar}
                refreshing={refreshing}
                ounceError={ounceError}
                dollarError={dollarError}
                onRefresh={loadAll}
              />
            )}
            {tab === "fx" && (
              <CurrencyCalc dollar={dollar} setDollar={setDollar} />
            )}
            {tab === "infl" && <InflationCalc gram18={derived.gram18} />}
          </div>

          <div className="foot">
            طلاسنج تهران — ابزار راهنما، نه توصیهٔ سرمایه‌گذاری. ·{" "}
            <Link href="/">صفحهٔ اصلی</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
