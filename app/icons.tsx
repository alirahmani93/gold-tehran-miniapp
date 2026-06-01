/* Lucide-style stroke icons — single consistent family, 1.75 stroke. */
import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const BubbleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="13" r="6" />
    <circle cx="17" cy="7" r="3" />
    <circle cx="8" cy="11" r="1.4" />
  </svg>
);

export const ScaleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3v18" />
    <path d="M7 21h10" />
    <path d="m3 8 4-4 4 4-4 1-4-1Z" />
    <path d="m13 8 4-4 4 4-4 1-4-1Z" />
    <path d="M3 8c0 2 1.5 3 4 3s4-1 4-3" opacity="0" />
  </svg>
);

export const CoinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10" />
    <path d="M9.5 9.5a2.5 2 0 0 1 2.5-1.5c1.4 0 2.5.7 2.5 1.8 0 2.2-5 1.5-5 3.6 0 1.1 1.1 1.8 2.5 1.8a2.5 2 0 0 0 2.5-1.5" />
  </svg>
);

export const ChartIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 3v18h18" />
    <path d="m7 14 3-3 3 3 4-5" />
  </svg>
);

export const GaugeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 14 16 9" />
    <path d="M3.5 18a9 9 0 1 1 17 0" />
    <circle cx="12" cy="14" r="1.4" />
  </svg>
);

export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
  </svg>
);

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ArrowIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    {/* RTL: points left = "forward" */}
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

export const BoltIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />
  </svg>
);
