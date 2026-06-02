"use client";

import { useState } from "react";
import { fmtNum, fmtToman, parseNum } from "@/lib/gold";
import { NumField, Stat } from "./parts";

const AED_PER_USD = 3.6725; // درهم امارات به دلار میخکوب
const USD_PER_OMR = 2.6008; // ریال عمان به دلار میخکوب

type CCode = "USD" | "EUR" | "GBP" | "AED" | "OMR" | "USDT";
type AnyCode = CCode | "IRT";

const META: Record<CCode, { sym: string; name: string }> = {
  USD: { sym: "$", name: "دلار آمریکا" },
  EUR: { sym: "€", name: "یورو" },
  GBP: { sym: "£", name: "پوند انگلیس" },
  AED: { sym: "د.إ", name: "درهم امارات" },
  OMR: { sym: "﷼", name: "ریال عمان" },
  USDT: { sym: "₮", name: "تتر" },
};
const ORDER: CCode[] = ["USD", "EUR", "GBP", "AED", "OMR", "USDT"];

export function CurrencyCalc({
  dollar,
  setDollar,
}: {
  dollar: string;
  setDollar: (v: string) => void;
}) {
  const [eur, setEur] = useState("1.08");
  const [gbp, setGbp] = useState("1.27");
  const [amt, setAmt] = useState("100");
  const [from, setFrom] = useState<AnyCode>("USD");
  const [to, setTo] = useState<AnyCode>("IRT");

  const d = parseNum(dollar);
  const eurusd = parseNum(eur);
  const gbpusd = parseNum(gbp);

  const T: Record<CCode, number> = {
    USD: d,
    USDT: d,
    EUR: d * eurusd,
    GBP: d * gbpusd,
    AED: d / AED_PER_USD,
    OMR: d * USD_PER_OMR,
  };

  const tomanOf = (c: AnyCode) => (c === "IRT" ? 1 : T[c]);
  const conv = (parseNum(amt) * tomanOf(from)) / (tomanOf(to) || 1);

  const opts: AnyCode[] = ["IRT", ...ORDER];
  const label = (c: AnyCode) => (c === "IRT" ? "تومان" : c);

  return (
    <>
      <div className="card">
        <div className="card-h">
          <h3>نرخ‌های پایه</h3>
        </div>
        <div className="card-sub">
          دلار از تب طلا مشترک است. جفت‌ارزهای شناور را می‌توانی ویرایش کنی.
        </div>
        <NumField
          label="دلار آزاد (USD)"
          tip="قیمت دلار/تتر به تومان."
          value={dollar}
          onChange={setDollar}
          unit="تومان"
        />
        <div className="grid2" style={{ marginTop: 11 }}>
          <NumField
            label="EUR / USD"
            tip="هر یورو چند دلار."
            value={eur}
            onChange={setEur}
            pre="$"
          />
          <NumField
            label="GBP / USD"
            tip="هر پوند چند دلار."
            value={gbp}
            onChange={setGbp}
            pre="$"
          />
        </div>
      </div>

      <div className="sec-label">ارزش هر واحد به تومان</div>
      <div className="card">
        {ORDER.map((c) => (
          <div className="crow" key={c}>
            <div
              className="flag"
              style={{
                fontSize: META[c].sym.length > 1 ? 12 : 17,
                fontWeight: 700,
              }}
            >
              {META[c].sym}
            </div>
            <div className="ci">
              <b>{META[c].name}</b>
              <span>{c}</span>
            </div>
            <div className="cv">
              <div className="t num">{fmtToman(T[c])}</div>
              <div className="u">تومان</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sec-label">جفت‌ارزها در برابر دلار</div>
      <div className="card">
        <Stat
          label="EUR / USD"
          tip="هر یورو چند دلار"
          value={fmtNum(eurusd, 2)}
          unit="$"
        />
        <Stat
          label="GBP / USD"
          tip="هر پوند چند دلار"
          value={fmtNum(gbpusd, 2)}
          unit="$"
        />
        <Stat
          label="AED / USD"
          tag="ثابت"
          tip="درهم امارات به دلار میخکوب است (۳٫۶۷۲۵ درهم = ۱ دلار)"
          value={fmtNum(1 / AED_PER_USD, 2)}
          unit="$"
        />
        <Stat
          label="OMR / USD"
          tag="ثابت"
          tip="ریال عمان به دلار میخکوب است (۱ ریال = ۲٫۶۰۰۸ دلار)"
          value={fmtNum(USD_PER_OMR, 2)}
          unit="$"
        />
      </div>

      <div className="sec-label">تبدیل ارز</div>
      <div className="card">
        <NumField
          label="مبلغ"
          value={amt}
          onChange={setAmt}
          unit={label(from)}
        />
        <div className="grid2" style={{ marginTop: 11, marginBottom: 14 }}>
          <label className="field">
            <span className="field-lab">از</span>
            <span className="inp">
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value as AnyCode)}
              >
                {opts.map((c) => (
                  <option key={c} value={c} style={{ background: "#1c2027" }}>
                    {label(c)}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="field">
            <span className="field-lab">به</span>
            <span className="inp">
              <select
                value={to}
                onChange={(e) => setTo(e.target.value as AnyCode)}
              >
                {opts.map((c) => (
                  <option key={c} value={c} style={{ background: "#1c2027" }}>
                    {label(c)}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
        <div className="bigres">
          <span className="n num t-fair">
            {parseNum(amt) > 0 ? fmtNum(conv, 2) : "—"}
          </span>
          <span className="u">{label(to)}</span>
        </div>
      </div>

      <div className="note">
        درهم امارات و ریال عمان به دلار میخکوب‌اند؛ نرخشان ثابت در نظر گرفته
        شده. یورو و پوند را دستی به‌روز کن.
      </div>
    </>
  );
}
