"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCapsule } from "@/components/story/CapsuleWrapper";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { Sun, Moon, Languages } from "lucide-react";
import {
  CHAPTER_THEMES, DATES, STATS_DATA, FEATURES,
  FUTURE_ITEMS_AR, FUTURE_ITEMS_EN, REVIEWS,
} from "./story-data";
import "./story.css";

type Lang = "en" | "ar";

function Stars({ size = 12 }: { size?: number }) {
  return (
    <div className="flex gap-[2px]" style={{ color: "#EAB308" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function useLang(): [Lang, () => void] {
  const [lang, setLang] = useState<Lang>("ar");
  const toggle = useCallback(() => setLang((l) => (l === "en" ? "ar" : "en")), []);
  return [lang, toggle];
}

export function Story() {
  const { setCapsuleOpen } = useCapsule();
  const [lang, toggleLang] = useLang();
  const [lightMode, setLightMode] = useState(false);
  const [expandedStat, setExpandedStat] = useState<number | null>(null);
  const isAr = lang === "ar";
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chapters = document.querySelectorAll("[data-ch]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    chapters.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [lang]);

  return (
    <div className={`story-page ${lightMode ? "light-mode" : ""}`} dir="rtl">



      {/* ─── TOP BAR ─── */}
      <button
        onClick={() => setCapsuleOpen(true)}
        className="fixed top-4 z-50"
        style={{ left: "1rem" }}
        aria-label="Menu"
      >
        <div
          className="rounded-full backdrop-blur-md transition-colors hover:brightness-150"
          style={{
            border: "1px solid var(--c-border)",
            background: "var(--c-btn-bg)",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <MedOneXLogoMark
            className={`h-5 w-5 ${lightMode ? "text-black" : "text-white"}`}
            interactiveColor
          />
        </div>
      </button>

      <div
        className="fixed top-4 z-50 flex items-center gap-2"
        style={{ right: "1rem" }}
      >
        <a
          href="/auth?mode=signin"
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium backdrop-blur-md transition-all"
          style={{
            border: "1px solid color-mix(in srgb, #00D4FF 40%, transparent)",
            background: lightMode ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.1)",
            color: "#00D4FF",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,212,255,0.18)"; e.currentTarget.style.borderColor = "#00D4FF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = lightMode ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.1)"; e.currentTarget.style.borderColor = "color-mix(in srgb, #00D4FF 40%, transparent)"; }}
        >
          {isAr ? "تسجيل الدخول" : "Sign In"}
        </a>
        <button
          onClick={() => setLightMode((p) => !p)}
          className="flex items-center justify-center rounded-full w-9 h-9 backdrop-blur-md transition-colors"
          style={{
            border: "1px solid var(--c-border)",
            background: "var(--c-btn-bg)",
            color: "var(--c-text-dim)",
          }}
          title={lightMode ? (isAr ? "داكن" : "Dark") : isAr ? "فاتح" : "Light"}
        >
          {lightMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={toggleLang}
          className="flex items-center justify-center rounded-full w-9 h-9 backdrop-blur-md transition-colors"
          style={{
            border: "1px solid var(--c-border)",
            background: "var(--c-btn-bg)",
            color: "var(--c-text-dim)",
          }}
          title={isAr ? "English" : "بالعربي"}
        >
          <Languages className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ─── MARQUEE BACKGROUND ─── */}
      {(() => {
        const ROW_COPIES = 2;
        const rows = [
          REVIEWS.slice(0, 5),
          REVIEWS.slice(5, 10),
        ];
        const dirs: ("marquee-right" | "marquee-left")[] = [
          "marquee-right",
          "marquee-left",
        ];
        return (
          <div className="marquee-bg">
            {rows.map((set, ri) => (
              <div key={ri} className={`marquee-row ${dirs[ri]}`}>
                {Array.from({ length: ROW_COPIES }).map((_, ci) => (
                  <div key={ci} className="marquee-set">
                    {set.map((r, i) => (
                      <div key={i} className="review-card">
                        <Stars size={10} />
                        <p className="review-text">{isAr ? r.q : r.qEn}</p>
                        <div className="review-footer">
                          <div className="review-avatar">{(isAr ? r.name : r.nameEn).charAt(0)}</div>
                          <div className="review-info">
                            <p className="review-name">{isAr ? r.name : r.nameEn}</p>
                            <p className="review-role">{isAr ? r.role : r.roleEn}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {/* ─── HERO ─── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center text-center px-6 z-[1] overflow-hidden">

        <div className="relative z-10 max-w-lg mx-auto">
          <div className="hero-eyebrow">
            {isAr ? "القصة الكاملة · 2025 · ماضي وحاضر ومستقبل" : "The Complete Story · 2025 · Past, Present & Future"}
          </div>

          <div
            className="mx-auto mb-6"
            style={{
              width: "clamp(80px,16vw,160px)",
              height: "clamp(80px,16vw,160px)",
            }}
          >
            <MedOneXLogoMark
              className={`h-full w-full ${lightMode ? "text-black" : "text-white"}`}
              interactiveColor
            />
          </div>

          <div className="hero-sub-card">
            <p style={{ color: "var(--c-text-dim)" }}>
              {isAr
                ? "من سؤال واحد لطالب طب... إلى نظام تعليمي متكامل"
                : "From one medical student's question... to a complete education system"}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 mt-16" style={{ marginTop: "4rem" }}>
            <span className="text-[11px] tracking-[2px] uppercase" style={{ color: lightMode ? "#1A6BFF" : "rgba(0,212,255,0.7)" }}>
              {isAr ? "اسكرول" : "Scroll"}
            </span>
            <div className="scroll-line" />
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="divider">
        <div className="divider-line" />
        <span className="divider-label">{isAr ? "الرحلة الكاملة" : "The Full Journey"}</span>
        <div className="divider-line" />
      </div>

      {/* ─── CHAPTERS ─── */}
      <div ref={sectionsRef} className="max-w-[900px] mx-auto px-6 pb-24 relative z-[1]">
        {/* Ch 1 - البداية */}
        <div className={`chapter ch-${CHAPTER_THEMES[0]}`} data-ch>
          <div className="ch-spine">
            <div className="ch-dot" />
            <span className="ch-date">{DATES[0]}</span>
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "البداية" : "The Beginning"}</div>
            <h2 className="ch-title">
              {isAr ? "مشكلة حقيقية في حياة طالب حقيقي" : "A Real Problem for a Real Student"}
            </h2>
            <p className="ch-body">
              {isAr
                ? "طالب طب، السنة الثانية. أمامه ٤٠٠ سؤال. الامتحان بعد أسبوعين. والمصادر مبعثرة — فيديو هنا، PDF هناك، وأسئلة من سنة فاتت في مجموعة واتساب مش مرتبة."
                : "A second-year medical student. 400 questions to study. The exam is in two weeks. Resources are scattered — a video here, a PDF there, questions from last year in a messy WhatsApp group."}
            </p>
            <div className="ch-accent">
              {isAr
                ? '"ليه مفيش مكان واحد فيه كل حاجة؟ الأسئلة، الفيديوهات، الملفات — في نفس المكان؟"'
                : '"Why isn\'t there one place for everything? Questions, videos, files — all in one spot?"'}
            </div>
            <p className="ch-body">
              {isAr
                ? "هذا السؤال البسيط لم يكن فكرة شركة، ولا خطة عمل، ولا اجتماع. مجرد إحساس بإن في حاجة ناقصة."
                : "That simple question wasn't a company idea, a business plan, or a meeting. Just a feeling that something was missing."}
            </p>
          </div>
        </div>

        {/* Ch 2 - الخطوة الأولى */}
        <div className={`chapter ch-${CHAPTER_THEMES[1]}`} data-ch>
          <div className="ch-spine">
            <div className="ch-dot" />
            <span className="ch-date">{DATES[1]}</span>
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "الخطوة الأولى" : "The First Step"}</div>
            <h2 className="ch-title">
              {isAr ? "أول يوم — صفحة فارغة وحلم كبير" : "First Day — A Blank Page and a Big Dream"}
            </h2>
            <p className="ch-body">
              {isAr
                ? "البداية كانت بسيطة جداً. موقع بيعرض أسئلة وإجاباتها. مش أكتر. الاسم الأول:"
                : "The beginning was very simple. A website that shows questions and answers. Nothing more. The first name:"}
            </p>
            <div className="name-fx">
              <span className="name-pill np-old">MedQs</span>
            </div>
            <p className="ch-body">
              {isAr
                ? "بعد أول أسبوع، الأسئلة بدأت تتراكم:"
                : "After the first week, questions started piling up:"}
            </p>
            <div className="ch-accent">
              {isAr
                ? '"طب وإيه رأيك لو الطالب يقدر يتابع تقدمه؟ وفيديوهات شرح؟ وبطاقات مذاكرة؟ وملفات PDF؟"'
                : '"What if students could track progress? Explanation videos? Flashcards? PDF files?"'}
            </div>
            <p className="ch-body">
              {isAr
                ? "كل سؤال كان يفتح باب لفكرة جديدة. والفكرة الجديدة كانت تفتح باب لفكرتين. هكذا بدأ الموقع يكبر — فكرة فوق فكرة."
                : "Each question opened the door to a new idea. And the new idea opened two more doors. That's how the site grew — idea upon idea."}
            </p>
          </div>
        </div>

        {/* Ch 3 - الأزمة الأولى */}
        <div className={`chapter ch-${CHAPTER_THEMES[2]}`} data-ch>
          <div className="ch-spine">
            <div className="ch-dot" />
            <span className="ch-date">{DATES[2]}</span>
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "الأزمة الأولى" : "The First Crisis"}</div>
            <h2 className="ch-title">
              {isAr ? "لما الموقع وقع في أول ليلة" : "When the Site Crashed on the First Night"}
            </h2>
            <p className="ch-body">
              {isAr
                ? "تم رفع الموقع. تم مشاركة الرابط. جاء أول مستخدمين. وبعدين..."
                : "The site was deployed. The link was shared. The first users arrived. And then..."}
            </p>
            <div className="ch-accent">
              {isAr
                ? "الموقع وقف. قاعدة البيانات رفضت الاتصال. الأكواد بعتت رسائل خطأ. الساعة ٢ الصبح."
                : "The site stopped. The database refused to connect. Errors everywhere. 2 AM."}
            </div>
            <p className="ch-body">
              {isAr
                ? "المشكلة اتحلت بعد ٤ ساعات من البحث المتواصل."
                : "The problem was fixed after 4 hours of searching."}
            </p>
            <div className="ch-accent">
              {isAr
                ? "الدرس: كل حاجة بتشتغل لوحدها، مش معناه هتشتغل مع بعض."
                : "Lesson: Everything working alone doesn't mean it'll work together."}
            </div>
          </div>
        </div>

        {/* Ch 4 - AI */}
        <div className={`chapter ch-${CHAPTER_THEMES[3]}`} data-ch>
          <div className="ch-spine">
            <div className="ch-dot" />
            <span className="ch-date">{DATES[3]}</span>
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "الفكرة اللي غيرت كل حاجة" : "The Idea That Changed Everything"}</div>
            <h2 className="ch-title">
              {isAr ? "لما الذكاء الاصطناعي دخل الصورة" : "When AI Entered the Picture"}
            </h2>
            <p className="ch-body">
              {isAr
                ? "جاءت فكرة: مساعد ذكاء اصطناعي بيفهم في الطب ويشرح الأسئلة. وُلد:"
                : "An idea came: an AI assistant that understands medicine and explains questions. Born:"}
            </p>
            <div className="ch-accent" style={{ textAlign: "center", fontSize: "20px", fontWeight: 900 }}>
              {isAr ? "Dr. Q — دكتور رقمي" : "Dr. Q — A Digital Doctor"}
            </div>
            <p className="ch-body">
              {isAr
                ? "التحدي: خدمات AI بتكلف فلوس، والموقع مجاني. الحل؟"
                : "The challenge: AI services cost money, and the site is free. The solution?"}
            </p>
            <div className="ch-accent">
              {isAr
                ? '"نربط بـ ٦ شركات ذكاء اصطناعي مختلفة. لو واحدة وقفت، التانية تشتغل. لو التانية وقفت، التالتة تشتغل."'
                : '"Connect 6 different AI companies. If one stops, the second works. If the second stops, the third works."'}
            </div>
            <p className="ch-body">
              {isAr
                ? "النتيجة: Dr. Q مابيوقفش. مهما حصل في الخلفية، الطالب بيفضل يسأل ويجاوب."
                : "Result: Dr. Q never stops. No matter what happens in the background, the student keeps studying."}
            </p>
          </div>
        </div>

        {/* Ch 5 - Rebrand */}
        <div className={`chapter ch-${CHAPTER_THEMES[4]}`} data-ch>
          <div className="ch-spine">
            <div className="ch-dot" />
            <span className="ch-date">{DATES[4]}</span>
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "لحظة التحول الكبير" : "The Big Transformation"}</div>
            <h2 className="ch-title">
              {isAr ? "MedQs مات. MedOneX وُلد." : "MedQs Died. MedOneX Was Born."}
            </h2>
            <div className="stats-row">
              {STATS_DATA.map((s, i) => (
                <div
                  key={i}
                  className={`stat-chip ${s.theme} ${expandedStat === i ? "stat-active" : ""}`}
                  onClick={() => setExpandedStat(expandedStat === i ? null : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedStat(expandedStat === i ? null : i); } }}
                >
                  <div className="stat-num" style={{ color: s.numColor }}>{s.num}</div>
                  <div className="stat-lbl">{isAr ? s.labelAr : s.labelEn}</div>
                  <div className="stat-see">{isAr ? "ايه هي؟" : "See"}</div>
                </div>
              ))}
            </div>
            <div className={`stat-detail ${expandedStat !== null ? "stat-detail-open" : ""}`}>
              {expandedStat !== null && (
                <div className="stat-detail-inner">
                  <button className="stat-detail-close" onClick={() => setExpandedStat(null)}>×</button>
                  <div className="stat-detail-title">
                    {isAr ? STATS_DATA[expandedStat].detailTitleAr : STATS_DATA[expandedStat].detailTitleEn}
                  </div>
                  <div className="stat-detail-list">
                    {(isAr ? STATS_DATA[expandedStat].itemsAr : STATS_DATA[expandedStat].itemsEn).map((item, j) => (
                      <div key={j} className="stat-detail-item">✓ {item}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="name-fx">
              <span className="name-pill np-old">MedQs</span>
              <span className="np-arrow">←</span>
              <span className="name-pill np-new">MedOneX</span>
            </div>
            <div className="ch-accent">
              {isAr
                ? '"مش بس غيرنا الاسم. غيرنا الهوية كلها. الشعار، الألوان، الرسالة. كأننا عمدنا الموقع من جديد."'
                : '"We didn\'t just change the name. We changed the entire identity. The logo, colors, message. It was like baptizing the site anew."'}
            </div>
          </div>
        </div>

        {/* Ch 6 - Hardest Crisis */}
        <div className={`chapter ch-${CHAPTER_THEMES[5]}`} data-ch>
          <div className="ch-spine">
            <div className="ch-dot" />
            <span className="ch-date">{DATES[5]}</span>
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "الأزمة الأصعب" : "The Hardest Crisis"}</div>
            <h2 className="ch-title">
              {isAr ? "لما كل حاجة اتكسرت في نفس الوقت" : "When Everything Broke at Once"}
            </h2>
            <p className="ch-body">
              {isAr
                ? "تغيير قاعدة البيانات بالكامل — زي ما بتنقل كل أثاث بيتك لبيت جديد وانت مش واقف الشغل. في يوم واحد:"
                : "Migrating the entire database — imagine moving your furniture to a new house while still living in it. In one day:"}
            </p>
            <div className="ch-accent">
              {isAr
                ? "الـ login وقف · الأسئلة اختفت · الفيديوهات بطلت تشتغل · ٣ رسائل خطأ مختلفة في نفس الوقت"
                : "Login stopped · Questions disappeared · Videos broke · 3 different errors at the same time"}
            </div>
            <p className="ch-body">
              {isAr
                ? "الحل أخذ ٤٨ ساعة متواصلة. لكن في النهاية، كل حاجة رجعت أحسن من قبل — وأسرع."
                : "The fix took 48 continuous hours. But in the end, everything came back better and faster."}
            </p>
            <div className="ch-accent">
              {isAr
                ? "الدرس: كل أزمة بتنتهي بنظام أقوى. كل مشكلة بتنحل بفهم أعمق."
                : "Lesson: Every crisis ends with a stronger system. Every problem is solved with deeper understanding."}
            </div>
          </div>
        </div>

        {/* Ch 7 - User Ideas */}
        <div className={`chapter ch-${CHAPTER_THEMES[6]}`} data-ch>
          <div className="ch-spine">
            <div className="ch-dot" />
            <span className="ch-date">{DATES[6]}</span>
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "الأفكار من المستخدمين" : "Ideas from Users"}</div>
            <h2 className="ch-title">
              {isAr ? '"ليه مفيش..." — الجملة اللي بنيت الموقع' : '"Why isn\'t there..." — The Sentence That Built the Site'}
            </h2>
            <p className="ch-body">
              {isAr
                ? "كل ميزة كبيرة في MedOneX جاءت من سؤال بسيط قاله طالب:"
                : "Every major feature in MedOneX came from a simple question a student asked:"}
            </p>
            <div className="ideas-list">
              <div className="idea-row">
                <div className="idea-q">
                  {isAr ? '"ليه مفيش بوت تيليجرام أذاكر منه في الميكروباص؟"' : '"Why no Telegram bot for studying on the bus?"'}
                </div>
                <div className="idea-arr">←</div>
                <div className="idea-a">{isAr ? "بوت تيليجرام متكامل" : "Full Telegram Bot"}</div>
              </div>
              <div className="idea-row">
                <div className="idea-q">
                  {isAr ? '"ليه مفيش لوحة رسم أشرح عليها للزملاء؟"' : '"Why no whiteboard to explain to classmates?"'}
                </div>
                <div className="idea-arr">←</div>
                <div className="idea-a">{isAr ? "DrawMed" : "DrawMed"}</div>
              </div>
              <div className="idea-row">
                <div className="idea-q">
                  {isAr ? '"ليه مفيش أطلس تشريح تفاعلي؟"' : '"Why no interactive anatomy atlas?"'}
                </div>
                <div className="idea-arr">←</div>
                <div className="idea-a">{isAr ? "Anatomy Atlas" : "Anatomy Atlas"}</div>
              </div>
            </div>
            <div className="ch-accent">
              {isAr
                ? "المنطق بسيط: الطالب هو اللي يعرف إيه اللي ناقص. الدور إننا نبنيه."
                : "Simple logic: the student knows what's missing. Our role is to build it."}
            </div>
          </div>
        </div>

        {/* Ch 8 - Today */}
        <div className={`chapter ch-${CHAPTER_THEMES[7]}`} data-ch>
          <div className="ch-spine">
            <div className="ch-dot" />
            <span className="ch-date">{DATES[7]}</span>
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "اليوم" : "Today"}</div>
            <h2 className="ch-title">
              {isAr ? "من سؤال واحد لنظام متكامل" : "From One Question to a Complete System"}
            </h2>
            <p className="ch-body">
              {isAr
                ? "MedOneX اليوم ليس موقع أسئلة. هو نظام تعليم طبي متكامل:"
                : "MedOneX today is not a question site. It's a complete medical education system:"}
            </p>
            <div className="feat-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="feat-item">
                  <div className="feat-dot" style={{ background: f.color }} />
                  {isAr ? f.label : f.labelEn}
                </div>
              ))}
            </div>
            <div className="ch-accent">
              {isAr
                ? '"بدأنا بسؤال واحد: ليه التعلم صعب؟ والإجابة لسه بتتبنى."'
                : '"We started with one question: Why is learning hard? And the answer is still being built."'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FUTURE ─── */}
      <div className="max-w-[900px] mx-auto px-6 mb-8 relative z-[1]">
        <div className="future-card" data-ch>
          <div className="future-mesh" />
          <div className="future-grid" />

          <h2 className="future-title">
            {isAr ? "المستقبل — " : "The Future — "}
            <span>{isAr ? "الفصل اللي لسه ما اتكتبش" : "The Chapter Not Yet Written"}</span>
          </h2>
          <p className="future-sub">
            {isAr
              ? "القصة مش خلصت. في فصول جاية لسه بتتكتب..."
              : "The story isn't over. There are chapters still being written..."}
          </p>

          <div className="future-items">
            {(isAr ? FUTURE_ITEMS_AR : FUTURE_ITEMS_EN).map((item, i) => (
              <div key={i} className="fi">
                <div className="fi-num">{i + 1}</div>
                <span className="fi-text">{item}</span>
              </div>
            ))}
          </div>

          <div className="closing-quote">
            <p className="cq-lead">
              {isAr
                ? "كل فكرة كبيرة بدأت بطالب قال..."
                : "Every big idea started with a student saying..."}
            </p>
            <div className="cq-main">
              {isAr ? '"ليه مفيش...؟"' : '"Why isn\'t there...?"'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
