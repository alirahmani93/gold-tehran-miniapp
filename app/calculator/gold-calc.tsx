"use client";

import { useMemo, useState } from "react";
import {
  buyWeight,
  cleanNumInput,
  derive,
  fmtNum,
  fmtToman,
  gramOfKarat,
  groupDigits,
  parseNum,
  sellPrice,
  C,
} from "@/lib/gold";
import { Accordion, Icon, NumField, Stat, Tip } from "./parts";

const FINENESS_PERMILLE: Record<number, number> = {
  24: 995,
  22: 916,
  21: 875,
  18: 750,
  17: 705,
};

const CARAT_OPTS = [24, 21, 18, 17] as const;

type SigKey = "buy" | "fair" | "sell";

function signalFromRatio(
  r: number,
): { key: SigKey; label: string; lean: string | null } | null {
  if (!isFinite(r) || r <= 0) return null;
  if (r < 11.2) return { key: "buy", label: "سکه به‌صرفه", lean: "سکه" };
  if (r > 12.4) return { key: "sell", label: "سکه گران", lean: "طلا / آبشده" };
  return { key: "fair", label: "بازار متعادل", lean: null };
}

function bubbleTone(pct: number): SigKey {
  if (!isFinite(pct)) return "fair";
  if (pct < 3) return "buy";
  if (pct <= 12) return "fair";
  return "sell";
}

/** Compact Toman units used by the verdict-big number. */
function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " میلیارد";
  if (abs >= 1e6) return (n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " میلیون";
  if (abs >= 1e3) return Math.round(n / 1e3).toLocaleString("en-US") + " هزار";
  return fmtToman(n);
}

function BubbleRow({
  face,
  name,
  intrinsic,
  value,
  onChange,
}: {
  face: string;
  name: string;
  intrinsic: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const m = parseNum(value);
  const has = value !== "" && m > 0;
  const bub = m - intrinsic;
  const pct = intrinsic ? (bub / intrinsic) * 100 : 0;
  const tone = has ? bubbleTone(pct) : null;
  return (
    <div className="bub">
      <div className="face">{face}</div>
      <div className="mid">
        <div className="nm">{name}</div>
        <div className="intr">
          ذاتی: <span className="num">{fmtToman(intrinsic)}</span> تومان
        </div>
        <span className="inp mini-inp" style={{ height: "40px" }}>
          <input
            inputMode="decimal"
            value={groupDigits(value)}
            onChange={(e) => onChange(cleanNumInput(e.target.value))}
            placeholder="قیمت بازار"
          />
          <span className="unit">تومان</span>
        </span>
      </div>
      <div className="end">
        {has ? (
          <>
            <div className={"b t-" + tone}>
              <span className="num">
                {(bub >= 0 ? "+" : "−") + fmtToman(Math.abs(bub))}
              </span>
            </div>
            <div className={"p t-" + tone}>
              <span className="num">
                {(pct >= 0 ? "+" : "−") + fmtNum(Math.abs(pct), 2)}%
              </span>
            </div>
          </>
        ) : (
          <div className="p" style={{ color: "var(--txt-3)" }}>
            —
          </div>
        )}
      </div>
    </div>
  );
}

export interface GoldCalcProps {
  ounce: string;
  dollar: string;
  setOunce: (v: string) => void;
  setDollar: (v: string) => void;
  refreshing: boolean;
  ounceError?: string | null;
  dollarError?: string | null;
  onRefresh: () => void;
}

export function GoldCalc({
  ounce,
  dollar,
  setOunce,
  setDollar,
  refreshing,
  ounceError,
  dollarError,
  onRefresh,
}: GoldCalcProps) {
  const [full, setFull] = useState("63500000");
  const [half, setHalf] = useState("");
  const [quarter, setQuarter] = useState("");
  const [melt, setMelt] = useState("");
  const [carat, setCarat] = useState<(typeof CARAT_OPTS)[number]>(18);
  const [amt, setAmt] = useState("50000000");
  const [grm, setGrm] = useState("10");

  const inputs = useMemo(
    () => ({ ounceUsd: parseNum(ounce), dollarToman: parseNum(dollar) }),
    [ounce, dollar],
  );
  const d = useMemo(() => derive(inputs), [inputs]);

  const fullM = parseNum(full);
  const hasFull = full !== "" && fullM > 0;
  const bubFull = fullM - d.fullCoin;
  const pctFull = d.fullCoin ? (bubFull / d.fullCoin) * 100 : 0;
  const ratio = d.gram18 ? fullM / d.gram18 : 0;
  const sig = hasFull ? signalFromRatio(ratio) : null;

  // gauge position (ratio 10.5..13.0)
  const gpos = Math.max(0, Math.min(100, ((ratio - 10.5) / (13.0 - 10.5)) * 100));

  const gramCarat = gramOfKarat(d.mazaneh17, FINENESS_PERMILLE[carat]);
  const boughtG = gramCarat ? parseNum(amt) / gramCarat : 0;
  const worth = parseNum(grm) * gramCarat;

  return (
    <>
      {/* base inputs */}
      <div className="card">
        <div className="card-h" style={{ justifyContent: "space-between" }}>
          <h3>مبنای محاسبه</h3>
          <button
            type="button"
            className={"btn-ref" + (refreshing ? " spin" : "")}
            onClick={onRefresh}
            disabled={refreshing}
          >
            {Icon.refresh}
            <span>{refreshing ? "در حال دریافت…" : "بروزرسانی"}</span>
          </button>
        </div>
        <div className="card-sub">دو عدد پایه؛ بقیه از روی این‌ها محاسبه می‌شود.</div>
        <div className="grid2">
          <NumField
            label="انس جهانی طلا"
            tip="قیمت هر اونس طلا به دلار. هنگام باز شدن خودکار گرفته می‌شود."
            value={ounce}
            onChange={setOunce}
            unit="$"
          />
          <NumField
            label="دلار آزاد"
            tip="قیمت دلار/تتر به تومان. از Bitpin خودکار گرفته می‌شود."
            value={dollar}
            onChange={setDollar}
            unit="تومان"
          />
        </div>
        {(ounceError || dollarError) && (
          <div className="note err" style={{ marginTop: 11 }}>
            {ounceError && (
              <div>⚠️ انس: {ounceError} — مقدار فعلی دستی است.</div>
            )}
            {dollarError && (
              <div>⚠️ دلار: {dollarError} — قیمت را دستی وارد کن.</div>
            )}
          </div>
        )}
      </div>

      {/* VERDICT */}
      <div className={"verdict" + (sig ? " s-" + sig.key : "")}>
        <div className="verdict-top">
          {Icon.coin}
          <span>حباب سکه تمام</span>
          {sig && (
            <span
              className={"pill " + sig.key}
              style={{ marginInlineStart: "auto" }}
            >
              {sig.label}
            </span>
          )}
        </div>

        {hasFull ? (
          <>
            <div className={"verdict-big t-" + bubbleTone(pctFull)}>
              <span className="num">
                {(bubFull >= 0 ? "+" : "−") + compact(Math.abs(bubFull))}
              </span>
              <small>
                {" "}
                تومان ·{" "}
                <span className="num">
                  {(pctFull >= 0 ? "+" : "−") + fmtNum(Math.abs(pctFull), 2)}%
                </span>
              </small>
            </div>
            <div className="verdict-msg">
              قیمت بازار <b className="num">{fmtToman(fullM)}</b> در برابر ارزش
              ذاتی <span className="num">{fmtToman(d.fullCoin)}</span> تومان.
              {sig && sig.lean && (
                <>
                  {" "}
                  نسبت سکه به طلا <b className="num">{fmtNum(ratio, 2)}</b>{" "}
                  است؛ سمت <b>{sig.lean}</b> به‌صرفه‌تر دیده می‌شود.
                </>
              )}
              {sig && !sig.lean && (
                <>
                  {" "}
                  نسبت سکه به طلا <b className="num">{fmtNum(ratio, 2)}</b> در
                  محدودهٔ متعادل است.
                </>
              )}
            </div>

            <div className="gauge">
              <div className="gauge-track">
                <span
                  className="gauge-pin"
                  style={{ left: gpos + "%" }}
                />
              </div>
              <div className="gauge-scale">
                <span>۱۰٫۵ خرید سکه</span>
                <span>۱۱٫۲</span>
                <span>۱۲٫۴</span>
                <span>۱۳٫۰ خرید طلا</span>
              </div>
            </div>
          </>
        ) : (
          <div className="verdict-empty">
            قیمت بازار <b style={{ color: "var(--gold-2)" }}>سکه تمام</b> را
            وارد کن تا حباب، نسبت سکه به طلا و سیگنال خرید/فروش همین‌جا ظاهر
            شود.
            <div style={{ marginTop: 12 }}>
              <NumField
                label="قیمت بازار سکه تمام"
                tip="قیمتی که سکه تمام بهار آزادی الان در بازار معامله می‌شود."
                value={full}
                onChange={setFull}
                unit="تومان"
              />
            </div>
            <div
              className="intr"
              style={{
                fontSize: 12,
                color: "var(--txt-3)",
                marginTop: 9,
              }}
            >
              ارزش ذاتی (ذوب) سکه تمام:{" "}
              <span className="num">{fmtToman(d.fullCoin)}</span> تومان
            </div>
          </div>
        )}
      </div>

      {hasFull && (
        <div className="card" style={{ marginTop: -4 }}>
          <NumField
            label="قیمت بازار سکه تمام"
            tip="قیمتی که سکه تمام بهار آزادی الان در بازار معامله می‌شود."
            value={full}
            onChange={setFull}
            unit="تومان"
          />
        </div>
      )}

      <div className="sec-label">جزئیات قیمت</div>

      <Accordion
        icon={Icon.bars}
        title="قیمت‌های پایهٔ طلا"
        sub="مظنه و هر گرم بر اساس عیار"
        defaultOpen
      >
        <Stat
          label="مظنه"
          tag="مثقال ۱۷"
          tip="مثقال طلای ۱۷ عیار (۷۰۵)؛ مبنای بازار آبشده."
          value={fmtToman(d.mazaneh17)}
          strong
        />
        <Stat label="مثقال ۱۸ عیار" tag="۷۵۰" value={fmtToman(d.mesghal18)} />
        <Stat
          label="هر گرم طلای ۲۴"
          tag="۹۹۵"
          value={fmtToman(d.gram24)}
        />
        <Stat
          label="هر گرم طلای ۲۱"
          tag="۸۷۵"
          value={fmtToman(gramOfKarat(d.mazaneh17, 875))}
        />
        <Stat label="هر گرم طلای ۱۸" tag="۷۵۰" value={fmtToman(d.gram18)} />
        <Stat
          label="هر گرم آبشده"
          tag="۱۷ · ۷۰۵"
          value={fmtToman(d.meltedGram)}
        />
      </Accordion>

      <Accordion
        icon={Icon.coin}
        title="حباب سکه‌ها و آبشده"
        sub="قیمت بازار را وارد کن تا اختلاف با ذاتی حساب شود"
        defaultOpen
      >
        <BubbleRow
          face="تمام"
          name="سکه تمام"
          intrinsic={d.fullCoin}
          value={full}
          onChange={setFull}
        />
        <BubbleRow
          face="نیم"
          name="نیم‌سکه"
          intrinsic={d.halfCoin}
          value={half}
          onChange={setHalf}
        />
        <BubbleRow
          face="ربع"
          name="ربع‌سکه"
          intrinsic={d.quarterCoin}
          value={quarter}
          onChange={setQuarter}
        />
        <BubbleRow
          face="آب"
          name="هر گرم آبشده"
          intrinsic={d.meltedGram}
          value={melt}
          onChange={setMelt}
        />
        <div className="note">
          <b>حباب</b> = قیمت بازار منهای ارزش ذاتی (ارزش ذوب طلای داخل). عدد مثبت
          یعنی گران‌تر از طلای داخلش معامله می‌شود.
        </div>
      </Accordion>

      <Accordion
        icon={Icon.swap}
        title="تبدیل پول ↔ وزن"
        sub="با هر مبلغ چقدر طلا، و هر وزن چقدر می‌ارزد"
      >
        <div className="chips">
          {CARAT_OPTS.map((c) => (
            <button
              type="button"
              key={c}
              className={"chip" + (carat === c ? " on" : "")}
              onClick={() => setCarat(c)}
            >
              عیار {c} ({FINENESS_PERMILLE[c]})
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <NumField
            label="با این مبلغ چقدر طلا می‌خرم؟"
            value={amt}
            onChange={setAmt}
            unit="تومان"
          />
          <div className="bigres">
            <span className="n num t-fair">
              {parseNum(amt) > 0 && gramCarat
                ? fmtNum(
                    buyWeight(parseNum(amt), d.mazaneh17, FINENESS_PERMILLE[carat]),
                    3,
                  )
                : parseNum(amt) > 0
                  ? fmtNum(boughtG, 3)
                  : "—"}
            </span>
            <span className="u">گرم طلای {FINENESS_PERMILLE[carat]}</span>
          </div>
        </div>
        <div>
          <NumField
            label="این مقدار طلا چقدر می‌ارزد؟"
            value={grm}
            onChange={setGrm}
            unit="گرم"
          />
          <div className="bigres">
            <span className="n num t-fair">
              {parseNum(grm) > 0
                ? fmtToman(
                    sellPrice(parseNum(grm), d.mazaneh17, FINENESS_PERMILLE[carat]),
                  )
                : "—"}
            </span>
            <span className="u">تومان</span>
          </div>
          {/* worth fallback kept to silence unused warning, mirrors design's parity calc */}
          <span hidden>{worth}</span>
        </div>
      </Accordion>

      <div className="note" style={{ marginTop: 4 }}>
        <b>ارزش ذاتی</b> = ارزش ذوب طلای داخل سکه/آبشده از روی انس و دلار.
        آستانه‌های نسبت (۱۱٫۲ و ۱۲٫۴) تجربی‌اند و راهنما هستند، نه توصیهٔ
        سرمایه‌گذاری. (ثابت‌های پایه: troy oz = {C.OUNCE_G}, مثقال ={" "}
        {C.MESGHAL_G})
      </div>
    </>
  );
}
