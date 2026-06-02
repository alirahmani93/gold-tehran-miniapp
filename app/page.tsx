import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "طلاسنج تهران | حباب، مظنه و نسبت سکه به طلا",
  description:
    "محاسبهٔ لحظه‌ای قیمت طلا، سکه، مظنه و حباب بازار بر اساس انس جهانی و دلار آزاد — به‌همراه نرخ ارز و محاسبهٔ تورم. مینی‌اپ تلگرام.",
  openGraph: {
    title: "طلاسنج تهران",
    description: "حباب، مظنه، نسبت سکه به طلا، نرخ ارز و تورم — لحظه‌ای.",
    type: "website",
  },
};

const APP_URL = "/calculator";

const FEATURES = [
  {
    title: "انس جهانی، زنده",
    body: "قیمت انس از منبع آنلاین به‌صورت خودکار گرفته می‌شود؛ با یک دکمه بروزرسانی کن.",
    icon: (
      <path d="M12 3v18M5 8l7-5 7 5M5 8v8l7 5 7-5V8" />
    ),
  },
  {
    title: "تشخیص حباب",
    body: "حباب سکه و طلای آبشده را نسبت به ارزش ذاتی (ذوب) لحظه‌ای و با سیگنال رنگی محاسبه می‌کند.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9 9.5h4.5a1.8 1.8 0 010 3.6H9.5" />
      </>
    ),
  },
  {
    title: "نسبت سکه به طلا",
    body: "نسبت رایج بازاری‌ها با بازه‌های تصمیم‌گیری: کِی بخر، کِی بفروش.",
    icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  },
  {
    title: "نرخ ارز و جفت‌ارزها",
    body: "دلار، یورو، پوند، درهم امارات و ریال عمان — با ارزش هر واحد به تومان و مبدل ارز.",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
  },
  {
    title: "تبدیل پول ↔ وزن",
    body: "با هر مبلغ چه وزنی طلا می‌خری، و هر وزن طلا چقدر می‌ارزد — با هر عیاری.",
    icon: <path d="M7 10h12l-3-3M17 14H5l3 3" />,
  },
  {
    title: "محاسبهٔ تورم",
    body: "ببین تورم چقدر از ارزش پول نقدت می‌خورد و چرا طلا سپر تورم است.",
    icon: (
      <path d="M12 3s4 3.5 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1-3 0 1.5 1 2 1.5 2C10 8 12 6 12 3z" />
    ),
  },
];

const TOOLS = [
  {
    title: "طلا و سکه",
    body: "مظنه، ذاتی، حباب، نسبت و آربیتراژ.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9 9.5h4.5a1.8 1.8 0 010 3.6H9.5" />
      </>
    ),
  },
  {
    title: "ارز",
    body: "EUR/USD، AED/USD، OMR/USD و مبدل ارز.",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
  },
  {
    title: "تورم",
    body: "افت قدرت خرید پول نقد در طول زمان.",
    icon: (
      <path d="M12 3s4 3.5 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1-3 0 1.5 1 2 1.5 2C10 8 12 6 12 3z" />
    ),
  },
];

const STEPS = [
  {
    n: "1",
    title: "دو عدد را وارد کن",
    body: "انس جهانی (خودکار) و قیمت دلار آزاد. مبنای همهٔ محاسبات همین دو است.",
  },
  {
    n: "2",
    title: "قیمت بازار را بده",
    body: "قیمت بازار سکه یا طلای آبشده را وارد کن تا حباب و نسبت‌ها حساب شود.",
  },
  {
    n: "3",
    title: "تصمیم بگیر",
    body: "بازه‌های رنگی نشان می‌دهند حباب کم است یا زیاد، و کدام سمت بازار بهتر است.",
  },
];

const FAQ = [
  {
    q: "قیمت‌ها از کجا می‌آید؟",
    a: "انس جهانی به‌صورت خودکار از یک منبع آنلاین گرفته می‌شود. قیمت دلار آزاد و قیمت بازار سکه را خودت وارد می‌کنی تا محاسبه دقیق و مطابق بازار لحظه‌ای تو باشد.",
    open: true,
  },
  {
    q: "حباب دقیقاً یعنی چه؟",
    a: "حباب = قیمت بازار منهای ارزش ذاتی (ارزش ذوب طلای داخل سکه). حباب مثبت یعنی سکه گران‌تر از طلای داخلش معامله می‌شود.",
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

function FeatIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {children}
    </svg>
  );
}

const Chevron = () => (
  <svg
    className="chev"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M5 12l5 5 9-9" />
  </svg>
);

export default function Landing() {
  return (
    <div id="main" className="lp-root">
      <nav className="lp-nav">
        <div className="lp-wrap">
          <a className="lp-logo" href="/">
            <span className="lp-mark">ط</span>
            <span>طلاسنج تهران</span>
          </a>
          <div className="lp-sp" />
          <a className="lp-btn lp-btn-ghost" href="#features">
            امکانات
          </a>
          <a className="lp-btn lp-btn-gold" href={APP_URL}>
            باز کردن محاسبه‌گر
          </a>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              محاسبهٔ لحظه‌ای بازار طلا، ارز و تورم
            </div>
            <h1>
              قیمت واقعی طلا و سکه را{" "}
              <span className="lp-gold-text">لحظه‌ای</span> بفهم
            </h1>
            <p className="lp-lead">
              مظنه، ارزش ذاتی سکه، طلای آبشده و حباب بازار — همه از روی انس
              جهانی و دلار آزاد. ببین کجا حباب هست و کدام سمت معامله به سودت
              است.
            </p>
            <div className="lp-cta-row">
              <a className="lp-btn lp-btn-gold lp-btn-lg" href={APP_URL}>
                باز کردن محاسبه‌گر
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M14 5l-7 7 7 7" />
                </svg>
              </a>
              <a className="lp-btn lp-btn-ghost lp-btn-lg" href="#features">
                امکانات را ببین
              </a>
            </div>
            <div className="lp-trust">
              <span>
                <Check />
                رایگان
              </span>
              <span>
                <Check />
                داخل تلگرام باز می‌شود
              </span>
              <span>
                <Check />
                بدون ثبت‌نام
              </span>
            </div>
          </div>

          <div className="lp-phone">
            <div className="lp-ph-top">
              <span className="lp-ph-m">ط</span>
              <b>طلاسنج تهران</b>
              <span className="lp-ph-live">
                <i />
                انس زنده · <span className="num">2,400</span>$
              </span>
            </div>
            <div className="lp-vcard">
              <div className="lp-vt">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="#f0d98a"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v10M9 9.5h4.5a1.8 1.8 0 010 3.6H9.5" />
                </svg>
                حباب سکه تمام<span className="lp-pill">بازار متعادل</span>
              </div>
              <div className="lp-big">
                <span className="num">+9.12</span>
                <small>
                  {" "}
                  میلیون تومان · <span className="num">+16.77%</span>
                </small>
              </div>
              <div className="lp-msg">
                قیمت بازار <span className="num">63,500,000</span> در برابر ارزش
                ذاتی <span className="num">54,382,124</span> تومان. نسبت سکه به
                طلا <span className="num">11.40</span>.
              </div>
              <div className="lp-gauge">
                <i />
              </div>
            </div>
            <div className="lp-ph-list">
              <div className="lp-ph-row">
                <span className="l">مظنه (مثقال ۱۷)</span>
                <span className="v num">24,127,342</span>
              </div>
              <div className="lp-ph-row">
                <span className="l">هر گرم طلای ۱۸</span>
                <span className="v num">5,569,848</span>
              </div>
              <div className="lp-ph-row">
                <span className="l">سکه تمام (ذاتی)</span>
                <span className="v num">54,382,124</span>
              </div>
              <div className="lp-ph-row">
                <span className="l">هر گرم آبشده</span>
                <span className="v num">5,235,657</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="lp-section">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <div className="lp-kicker">امکانات</div>
            <h2>هر چیزی که برای تصمیم لازم داری</h2>
            <p>از قیمت‌گذاری پایه تا تشخیص حباب و آربیتراژ — یک‌جا و فارسی.</p>
          </div>
          <div className="lp-feat">
            {FEATURES.map((f) => (
              <div className="lp-fcard" key={f.title}>
                <div className="lp-fic">
                  <FeatIcon>{f.icon}</FeatIcon>
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <div className="lp-kicker">سه ابزار، یک‌جا</div>
            <h2>بین محاسبه‌گرها راحت جابه‌جا شو</h2>
            <p>یک نوار بالای صفحه؛ با یک لمس از طلا به ارز یا تورم سوییچ کن.</p>
          </div>
          <div className="lp-tools">
            {TOOLS.map((t) => (
              <div className="lp-tool" key={t.title}>
                <div className="lp-tic">
                  <FeatIcon>{t.icon}</FeatIcon>
                </div>
                <div>
                  <b>{t.title}</b>
                  <span>{t.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <div className="lp-kicker">در سه قدم</div>
            <h2>از دو عدد تا تصمیم</h2>
          </div>
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div className="lp-step" key={s.n}>
                <div className="lp-step-n num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-sec-head">
            <div className="lp-kicker">سؤال‌های متداول</div>
            <h2>هرچه باید بدانی</h2>
          </div>
          <div className="lp-faq">
            {FAQ.map((f) => (
              <details className="lp-qa" key={f.q} open={f.open}>
                <summary>
                  {f.q}
                  <Chevron />
                </summary>
                <div className="lp-qa-a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-final">
            <h2>همین حالا حباب بازار را بسنج</h2>
            <p>دو عدد وارد کن و در چند ثانیه ببین طلا یا سکه به‌صرفه است یا نه.</p>
            <a
              className="lp-btn lp-btn-gold lp-btn-xl"
              href={APP_URL}
            >
              باز کردن محاسبه‌گر
            </a>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        طلاسنج تهران — ابزار راهنما، نه توصیهٔ سرمایه‌گذاری.
      </footer>
    </div>
  );
}
