import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "محاسبه قیمت طلا و سکه تهران",
  description:
    "محاسبه قیمت طلا، سکه، مظنه و حباب بر اساس انس جهانی و دلار — مینی‌اپ تلگرام",
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[100] focus:rounded-lg focus:px-3 focus:py-2 focus:text-sm focus:font-bold"
          style={{
            background: "var(--gold-500,#d68a14)",
            color: "#1a1205",
          }}
        >
          پرش به محتوای اصلی
        </a>
        <header
          className="sticky top-0 z-40 backdrop-blur"
          style={{
            background: "color-mix(in srgb, var(--bg) 85%, transparent)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="mx-auto flex max-w-md md:max-w-4xl lg:max-w-6xl items-center gap-2 px-4 md:px-6 py-3">
            <Link
              href="/"
              aria-label="خانه"
              className="flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #edc04e, #b96a0f)",
                  color: "#1a1205",
                  fontWeight: 800,
                }}
                aria-hidden
              >
                ط
              </span>
              <span className="text-sm font-extrabold text-gold-300">
                طلای تهران
              </span>
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
