"use client";

import { useState, type ReactNode } from "react";
import { cleanNumInput, groupDigits } from "@/lib/gold";

/* ===== icons (mirrors core.jsx `I`) ===== */
export const Icon = {
  coin: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 9.5h4.5a1.8 1.8 0 010 3.6H9.5" />
    </svg>
  ),
  bars: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  swap: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 10h12l-3-3M17 14H5l3 3" />
    </svg>
  ),
  cash: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  fire: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3s4 3.5 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1-3 0 1.5 1 2 1.5 2C10 8 12 6 12 3z" />
    </svg>
  ),
  refresh: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 11-2.6-6.4M21 4v4h-4" />
    </svg>
  ),
  chev: (
    <svg
      className="chev"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};

/* ===== Tip — info popover with hover/focus reveal ===== */
export function Tip({ text }: { text: string }) {
  return (
    <span className="tip">
      <button type="button" className="q" aria-label="راهنما">
        i
      </button>
      <span className="pop" role="tooltip">
        {text}
      </span>
    </span>
  );
}

/* ===== NumField ===== */
export function NumField({
  label,
  tip,
  value,
  onChange,
  placeholder,
  pre,
  unit,
}: {
  label: string;
  tip?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  pre?: string;
  unit?: string;
}) {
  return (
    <label className="field">
      <span className="field-lab">
        {label}
        {tip && <Tip text={tip} />}
      </span>
      <span className="inp">
        {pre && <span className="pre">{pre}</span>}
        <input
          inputMode="decimal"
          value={groupDigits(value)}
          onChange={(e) => onChange(cleanNumInput(e.target.value))}
          placeholder={placeholder || "0"}
        />
        {unit && <span className="unit">{unit}</span>}
      </span>
    </label>
  );
}

/* ===== Stat row ===== */
export function Stat({
  label,
  tag,
  value,
  unit = "تومان",
  tip,
  strong,
}: {
  label: string;
  tag?: string;
  value: string;
  unit?: string;
  tip?: string;
  strong?: boolean;
}) {
  return (
    <div className="stat">
      <span className="lab">
        {label}
        {tag && <span className="tag">{tag}</span>}
        {tip && <Tip text={tip} />}
      </span>
      <span
        className="val"
        style={strong ? { color: "var(--gold-2)" } : undefined}
      >
        <span className="num">{value}</span>
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}

/* ===== Accordion ===== */
export function Accordion({
  icon,
  title,
  sub,
  children,
  defaultOpen = false,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={"acc" + (open ? " open" : "")}>
      <button
        type="button"
        className="acc-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="ic">{icon}</span>
        <span className="tt">
          <b>{title}</b>
          {sub && <span>{sub}</span>}
        </span>
        {Icon.chev}
      </button>
      <div className="acc-body">{children}</div>
    </div>
  );
}
