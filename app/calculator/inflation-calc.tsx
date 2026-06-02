"use client";

import { useState } from "react";
import { fmtNum, fmtToman, parseNum } from "@/lib/gold";
import { Icon, NumField, Stat } from "./parts";

function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9)
    return (n / 1e9).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " میلیارد";
  if (abs >= 1e6)
    return (n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " میلیون";
  if (abs >= 1e3) return Math.round(n / 1e3).toLocaleString("en-US") + " هزار";
  return fmtToman(n);
}

export function InflationCalc({ gram18 }: { gram18: number }) {
  const [amt, setAmt] = useState("100000000");
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(40);

  const a = parseNum(amt);
  const f = Math.pow(1 + rate / 100, years);
  const real = a / f;
  const needed = a * f;
  const loss = a - real;
  const lossPct = a ? (loss / a) * 100 : 0;
  const gramsNow = gram18 ? a / gram18 : 0;

  const tone = lossPct > 60 ? "sell" : lossPct > 30 ? "fair" : "buy";
  const toneLabel =
    lossPct > 60 ? "افت شدید" : lossPct > 30 ? "افت قابل‌توجه" : "افت محدود";

  return (
    <>
      <div className="card">
        <div className="card-h">
          <h3>قدرت خرید پول</h3>
        </div>
        <div className="card-sub">
          ببین تورم چقدر از ارزش پول نقدت می‌خورد — و چرا طلا سپر تورم است.
        </div>
        <NumField label="مبلغ امروز" value={amt} onChange={setAmt} unit="تومان" />

        <div style={{ marginTop: 16 }}>
          <div className="rng-row">
            <span>بازهٔ زمانی</span>
            <span className="num" style={{ color: "var(--gold-2)" }}>
              {years} سال
            </span>
          </div>
          <input
            className="rng"
            type="range"
            min={1}
            max={15}
            step={1}
            value={years}
            onChange={(e) => setYears(+e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="rng-row">
            <span>نرخ تورم سالانه</span>
            <span className="num" style={{ color: "var(--gold-2)" }}>
              {rate}%
            </span>
          </div>
          <input
            className="rng"
            type="range"
            min={10}
            max={80}
            step={1}
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </div>
      </div>

      <div className={"verdict s-" + tone}>
        <div className="verdict-top">
          {Icon.fire}
          <span>ارزش واقعی پول نقد بعد از {years} سال</span>
          <span
            className={"pill " + tone}
            style={{ marginInlineStart: "auto" }}
          >
            {toneLabel}
          </span>
        </div>
        <div className={"verdict-big t-" + tone}>
          <span className="num">{compact(real)}</span>
          <small> تومان</small>
        </div>
        <div className="verdict-msg">
          <b className="num">{fmtToman(a)}</b> تومانِ امروز، با تورم سالانهٔ{" "}
          <b className="num">{rate}%</b>، پس از <b className="num">{years}</b>{" "}
          سال فقط به‌اندازهٔ <b className="num">{fmtToman(real)}</b> تومانِ
          امروز ارزش خرید دارد — یعنی{" "}
          <b className="num">{fmtNum(lossPct, 2)}%</b> از قدرت خریدت از بین
          می‌رود.
        </div>
      </div>

      <div className="card">
        <Stat label="مبلغ امروز" value={fmtToman(a)} />
        <Stat
          label="ارزش واقعی بعد از مدت"
          tip="معادل امروزِ همان مبلغ پس از تورم"
          value={fmtToman(real)}
        />
        <Stat
          label="افت قدرت خرید"
          value={fmtToman(loss)}
          tip="چقدر از ارزش پولت می‌سوزد"
        />
        <Stat
          label="برای حفظ ارزش لازم است"
          tip="چند تومان باید داشته باشی تا قدرت خرید امروز حفظ شود"
          value={fmtToman(needed)}
          strong
        />
      </div>

      <div className="sec-label">جایگزین: همین مبلغ در طلا</div>
      <div className="card">
        <div className="card-sub" style={{ marginBottom: 10 }}>
          طلا ارزش ذاتی دارد و معمولاً همگام با تورم رشد می‌کند؛ به‌جای
          نگه‌داری نقد، این مبلغ امروز معادل است با:
        </div>
        <div className="bigres">
          <span
            className="n num"
            style={{ color: "var(--gold-2)" }}
          >
            {a > 0 && gram18 ? fmtNum(gramsNow, 2) : "—"}
          </span>
          <span className="u">گرم طلای ۱۸ عیار</span>
        </div>
      </div>

      <div className="note">
        محاسبه بر پایهٔ تورم مرکب سالانه است و فقط برای درک بزرگی اثر تورم.
        نرخ واقعی تورم و رشد طلا سال‌به‌سال فرق می‌کند.
      </div>
    </>
  );
}
