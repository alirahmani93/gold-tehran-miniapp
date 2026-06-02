import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "طلاسنج تهران | حباب، مظنه و نسبت سکه به طلا",
  description:
    "محاسبهٔ لحظه‌ای قیمت طلا، سکه، مظنه و حباب بازار بر اساس انس جهانی و دلار آزاد — به‌همراه نرخ ارز و محاسبهٔ تورم. مینی‌اپ تلگرام.",
};

export const viewport: Viewport = {
  themeColor: "#0e1014",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
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
        {children}
      </body>
    </html>
  );
}
