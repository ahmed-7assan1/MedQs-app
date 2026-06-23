"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { ArrowLeft, Sun, Moon, Languages } from "lucide-react";
import Link from "next/link";

type Lang = "en" | "ar";

const CHAPTER_THEMES = ["blue", "cyan", "coral", "purple", "amber", "coral", "teal", "pink"];

const FEATURES = [
  { label: "أسئلة MCQ", labelEn: "MCQ Questions", color: "#1A6BFF" },
  { label: "فيديوهات شرح", labelEn: "Videos", color: "#00D4FF" },
  { label: "بطاقات مذاكرة", labelEn: "Flashcards", color: "#8B5CF6" },
  { label: "Dr. Q AI", labelEn: "Dr. Q AI", color: "#F472B6" },
  { label: "منتدى اجتماعي", labelEn: "Social Forum", color: "#FBBF24" },
  { label: "بوت تيليجرام", labelEn: "Telegram Bot", color: "#00FFB2" },
  { label: "لوح رسم طبي", labelEn: "Medical Board", color: "#1A6BFF" },
  { label: "أطلس تشريح", labelEn: "Anatomy Atlas", color: "#00D4FF" },
  { label: "تطبيق موبايل", labelEn: "Mobile App", color: "#8B5CF6" },
  { label: "غرف دراسة", labelEn: "Study Rooms", color: "#FF6B6B" },
  { label: "مسابقات مباشرة", labelEn: "Live Quizzes", color: "#FBBF24" },
  { label: "نقاط وترتيب", labelEn: "Leaderboard", color: "#00FFB2" },
];

const FUTURE_ITEMS_AR = [
  "كل كلية طب في مصر تلاقي نفسها على MedOneX",
  "Dr. Q يبقى مساعد طبي حقيقي مدرب على بيانات عربية",
  "امتحانات OSCE افتراضية — الطالب يتدرب مع مريض رقمي",
];
const FUTURE_ITEMS_EN = [
  "Every medical school in Egypt on MedOneX",
  "Dr. Q becomes a real Arabic-trained medical assistant",
  "Virtual OSCE exams — train with a digital patient",
];

const REVIEWS = [
  { q: "MedOneX غير طريقة مذاكرتي خالص. النظام بتاع التكرار المتباعد خلاني احتفظ بالمعلومات ٣ أضعاف.", qEn: "MedOneX completely changed my study method. The spaced repetition system helped me retain 3x more.", name: "أحمد علي", nameEn: "Ahmed Ali", role: "جامعة القاهرة", roleEn: "Cairo University" },
  { q: "Dr. Q AI بيفهم أسئلتي بالعربي ويرد بدقة. حرفيًا زي مدرس خصوصي 24 ساعة.", qEn: "Dr. Q AI understands my Arabic questions and responds accurately. Like a 24/7 personal tutor.", name: "سارة محمود", nameEn: "Sara Mahmoud", role: "جامعة عين شمس", roleEn: "Ain Shams University" },
  { q: "البطاقات التفاعلية والأسئلة اليومية خلقت عندي عادة مذاكرة مستمرة. أول مرة أذاكر بانتظام.", qEn: "The flashcards and daily quizzes built a consistent study habit. First time I've studied regularly.", name: "محمد حسن", nameEn: "Mohamed Hassan", role: "جامعة الإسكندرية", roleEn: "Alexandria University" },
  { q: "بفضل MedOneX جبت أول مرة امتحاناتي. التقييمات والتحليل واللي كانوا عايزينه.", qEn: "Thanks to MedOneX I aced my exams for the first time. The analytics showed me exactly what I needed.", name: "نورا إبراهيم", nameEn: "Noura Ibrahim", role: "جامعة المنصورة", roleEn: "Mansoura University" },
  { q: "التجميعات وأسئلة السنوات السابقة متاحة بسهولة. وفّر عليا وقت كبير في البحث.", qEn: "Previous year questions and compilations are easily available. Saved me so much time.", name: "لينا يوسف", nameEn: "Lina Youssef", role: "جامعة الزقازيق", roleEn: "Zagazig University" },
  { q: "غرف الدراسة التفاعلية خلّت المذاكرة الجماعية أسهل من الواتساب.", qEn: "Interactive study rooms made group studying easier than WhatsApp.", name: "عمر عبدالله", nameEn: "Omar Abdullah", role: "جامعة أسيوط", roleEn: "Assiut University" },
  { q: "منصة متكاملة — فيديوهات، أسئلة، بطاقات، و Dr. Q. مش محتاج حاجة تاني.", qEn: "All-in-one platform — videos, questions, flashcards, and Dr. Q. Don't need anything else.", name: "مريم وليد", nameEn: "Mariam Walid", role: "جامعة طنطا", roleEn: "Tanta University" },
  { q: "الترتيب والتنافس بين الطلاب حفزني أذاكر أكتر. نظام النقاط عبقري.", qEn: "The leaderboard competition motivated me to study more. The points system is genius.", name: "خالد أحمد", nameEn: "Khaled Ahmed", role: "جامعة بنها", roleEn: "Benha University" },
  { q: "بوت التيليجرام والموقع متزامنين — أذاكر في أي مكان ومن غير ما افتح الموقع.", qEn: "Telegram bot and site stay in sync — I study anywhere without opening the site.", name: "هدى جمال", nameEn: "Hoda Gamal", role: "جامعة المنوفية", roleEn: "Menoufia University" },
  { q: "أتلس التشريح ثلاثي الأبعاد خلاني أتخيل كل حرفيًا. الحفظ بقى فهم.", qEn: "The 3D anatomy atlas helped me visualize everything. Memorization turned into understanding.", name: "يوسف سامي", nameEn: "Youssef Sami", role: "جامعة بورسعيد", roleEn: "Port Said University" },
  { q: "دعم المجتمع في المنتدى كبير. أي سؤال بتلاقي إجابة من دفعة تانية.", qEn: "The community forum support is massive. Any question gets answered by other batches.", name: "دينا كمال", nameEn: "Dina Kamal", role: "جامعة السويس", roleEn: "Suez University" },
  { q: "حرفيًا حسّن مستوايا في المواد النظرية. بقيت بفهم بدل ما أحفظ.", qEn: "It literally improved my level in theoretical subjects. I understand instead of memorize.", name: "أسماء عاطف", nameEn: "Asma Atef", role: "جامعة قناة السويس", roleEn: "Suez Canal University" },
  { q: "المسابقات المباشرة (Live Quizzes) بتساعدني أراجع بسرعة قبل الامتحان.", qEn: "Live quizzes help me review quickly before the exam.", name: "إسلام ناصر", nameEn: "Islam Nasser", role: "جامعة كفر الشيخ", roleEn: "Kafr El Sheikh University" },
  { q: "التطبيق على الموبايل سهل وسريع. بذاكر في المواصلات.", qEn: "The mobile app is fast and easy. I study during commutes.", name: "منى شريف", nameEn: "Mona Sherif", role: "جامعة الفيوم", roleEn: "Fayoum University" },
  { q: "MedOneX مش مجرد موقع — هو نظام تعليمي متكامل. الطالب دلوقتي عنده كل حاجة.", qEn: "MedOneX isn't just a site — it's a complete education system. Students now have everything.", name: "إيمان رجب", nameEn: "Eman Ragab", role: "جامعة بني سويف", roleEn: "Beni Suef University" },
];

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
  const { siteName } = useSiteConfig();
  const [lang, toggleLang] = useLang();
  const [lightMode, setLightMode] = useState(false);
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

      <style>{`
        .story-page {
          --c-bg: #060E1E;
          --c-text: #FFFFFF;
          --c-text-dim: rgba(255,255,255,0.55);
          --c-text-dimmer: rgba(255,255,255,0.3);
          --c-border: rgba(255,255,255,0.08);
          --c-border-light: rgba(255,255,255,0.07);
          --c-card-bg: rgba(255,255,255,0.04);
          --c-card-bg-soft: rgba(255,255,255,0.03);
          --c-btn-bg: rgba(6,14,30,0.8);
          --c-shine: rgba(255,255,255,0.15);
          font-family: 'Cairo', 'Tajawal', sans-serif;
          background: var(--c-bg);
          color: var(--c-text);
          overflow-x: hidden;
          line-height: 1.7;
          min-height: 100vh;
          position: relative;
          transition: background 0.4s, color 0.4s;
        }
        .story-page.light-mode {
          --c-bg: #f0f2f5;
          --c-text: #1a1a2e;
          --c-text-dim: rgba(0,0,0,0.55);
          --c-text-dimmer: rgba(0,0,0,0.3);
          --c-border: rgba(0,0,0,0.08);
          --c-border-light: rgba(0,0,0,0.06);
          --c-card-bg: rgba(255,255,255,0.85);
          --c-card-bg-soft: rgba(255,255,255,0.7);
          --c-btn-bg: rgba(255,255,255,0.9);
          --c-shine: rgba(0,0,0,0.06);
        }
        .story-page.light-mode .np-old { color: var(--c-text-dimmer); }
        .story-page.light-mode .hero-eyebrow { color: #1A6BFF; }
        .story-page.light-mode .hero-eyebrow::before,
        .story-page.light-mode .hero-eyebrow::after { background: linear-gradient(to right, transparent, #1A6BFF); }
        .story-page.light-mode .hero-eyebrow::after { background: linear-gradient(to left, transparent, #1A6BFF); }
        .story-page.light-mode .ch-accent { color: var(--c-text); }

        /* Marquee background */
        .marquee-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          display: flex; flex-direction: column; justify-content: center; gap: 20px;
          overflow: hidden; opacity: 0.3;
        }
        .story-page.light-mode .marquee-bg { opacity: 0.08; }
        .marquee-row {
          display: flex; gap: 0; width: max-content;
          will-change: transform;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .marquee-set { display: flex; gap: 16px; }
        .marquee-right { animation: mR 30s linear infinite; }
        .marquee-left { animation: mL 30s linear infinite; }
        @keyframes mR {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes mL {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .review-card {
          flex-shrink: 0; width: 250px;
          background: var(--c-card-bg); padding: 18px 16px 14px;
          border-radius: 14px;
          border-left: 3px solid rgba(0,212,255,0.2);
          contain: layout style paint;
        }
        .review-text {
          margin-top: 10px; font-size: 12px; line-height: 1.65;
          color: var(--c-text-dim);
          display: -webkit-box;
          -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .review-footer {
          margin-top: 12px; border-top: 1px solid var(--c-border); padding-top: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .review-avatar {
          width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800;
          background: rgba(0,212,255,0.12); color: #00D4FF;
        }
        .review-info { flex: 1; min-width: 0; }
        .review-name { font-size: 12px; font-weight: 700; color: var(--c-text); }
        .review-role { font-size: 10px; color: var(--c-text-dim); margin-top: 1px; }

        .scroll-line {
          width: 1px; height: 50px;
          background: linear-gradient(to bottom, #00D4FF, transparent);
          animation: scrollAnim 1.5s ease-in-out infinite;
        }
        @keyframes scrollAnim {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0.5; transform: scaleY(0.7); }
        }

        /* ─── CHAPTER ─── */
        .chapter {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 0 2rem;
          margin-bottom: 5rem;
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .chapter.visible { opacity: 1; transform: translateY(0); }

        .ch-spine {
          display: flex; flex-direction: column; align-items: center; padding-top: 8px;
        }
        .ch-dot {
          width: 18px; height: 18px;
          border-radius: 50%;
          flex-shrink: 0;
          position: relative;
          z-index: 2;
        }
        .ch-dot::after {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          animation: dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 0.6; }
          50% { box-shadow: 0 0 0 8px transparent; opacity: 0; }
        }
        .ch-line {
          width: 1px; flex: 1; margin-top: 8px; min-height: 60px;
        }

        .ch-card {
          background: var(--c-card-bg);
          border: 1px solid var(--c-border);
          border-radius: 20px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        .ch-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--c-shine), transparent);
        }

        .ch-era { font-size: 11px; font-weight: 700; letter-spacing: 3px; margin-bottom: 0.5rem; }
        .ch-title { font-size: 26px; font-weight: 900; color: var(--c-text); margin-bottom: 1rem; line-height: 1.25; }
        .ch-body { font-size: 15px; color: var(--c-text-dim); line-height: 1.9; margin-bottom: 1rem; }

        .ch-accent {
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin: 1rem 0;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.8;
        }

        /* Theme colors */
        .ch-blue .ch-dot { background: #1A6BFF; color: #1A6BFF; box-shadow: 0 0 16px rgba(26,107,255,0.6); }
        .ch-blue .ch-line { background: linear-gradient(to bottom, #1A6BFF, transparent); }
        .ch-blue .ch-era { color: #3D8FFF; }
        .ch-blue .ch-accent { background: rgba(26,107,255,0.12); border-right: 3px solid #1A6BFF; color: #A5C4FF; }

        .ch-cyan .ch-dot { background: #00D4FF; color: #00D4FF; box-shadow: 0 0 16px rgba(0,212,255,0.6); }
        .ch-cyan .ch-line { background: linear-gradient(to bottom, #00D4FF, transparent); }
        .ch-cyan .ch-era { color: #00D4FF; }
        .ch-cyan .ch-accent { background: rgba(0,212,255,0.08); border-right: 3px solid #00D4FF; color: #7FE8FF; }

        .ch-coral .ch-dot { background: #FF6B6B; color: #FF6B6B; box-shadow: 0 0 16px rgba(255,107,107,0.6); }
        .ch-coral .ch-line { background: linear-gradient(to bottom, #FF6B6B, transparent); }
        .ch-coral .ch-era { color: #FF6B6B; }
        .ch-coral .ch-accent { background: rgba(255,107,107,0.08); border-right: 3px solid #FF6B6B; color: #FFAAAA; }

        .ch-purple .ch-dot { background: #8B5CF6; color: #8B5CF6; box-shadow: 0 0 16px rgba(139,92,246,0.6); }
        .ch-purple .ch-line { background: linear-gradient(to bottom, #8B5CF6, transparent); }
        .ch-purple .ch-era { color: #8B5CF6; }
        .ch-purple .ch-accent { background: rgba(139,92,246,0.1); border-right: 3px solid #8B5CF6; color: #C4B0FF; }

        .ch-amber .ch-dot { background: #FBBF24; color: #FBBF24; box-shadow: 0 0 16px rgba(251,191,36,0.6); }
        .ch-amber .ch-line { background: linear-gradient(to bottom, #FBBF24, transparent); }
        .ch-amber .ch-era { color: #FBBF24; }
        .ch-amber .ch-accent { background: rgba(251,191,36,0.08); border-right: 3px solid #FBBF24; color: #FFE08A; }

        .ch-teal .ch-dot { background: #00FFB2; color: #00FFB2; box-shadow: 0 0 16px rgba(0,255,178,0.6); }
        .ch-teal .ch-line { background: linear-gradient(to bottom, #00FFB2, transparent); }
        .ch-teal .ch-era { color: #00FFB2; }
        .ch-teal .ch-accent { background: rgba(0,255,178,0.08); border-right: 3px solid #00FFB2; color: #7AFFDA; }

        .ch-pink .ch-dot { background: #F472B6; color: #F472B6; box-shadow: 0 0 16px rgba(244,114,182,0.6); }
        .ch-pink .ch-line { background: linear-gradient(to bottom, #F472B6, transparent); }
        .ch-pink .ch-era { color: #F472B6; }
        .ch-pink .ch-accent { background: rgba(244,114,182,0.08); border-right: 3px solid #F472B6; color: #FFAAD4; }

        /* Stats */
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 1.25rem 0; }
        .stat-chip {
          border-radius: 14px; padding: 1rem; text-align: center;
          border: 1px solid var(--c-border); position: relative; overflow: hidden;
        }
        .stat-chip::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
        }
        .stat-num {
          font-size: 34px; font-weight: 900; line-height: 1; margin-bottom: 4px;
          color: var(--c-text);
        }
        .stat-lbl { font-size: 12px; color: var(--c-text-dim); }
        .s-blue { background: rgba(26,107,255,0.08); }
        .s-blue .stat-num { color: #00D4FF; }
        .s-purple { background: rgba(139,92,246,0.08); }
        .s-purple .stat-num { color: #A78BFA; }
        .s-teal { background: rgba(0,255,178,0.06); }
        .s-teal .stat-num { color: #00FFB2; }

        /* Name transition */
        .name-fx { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 1.25rem 0; flex-wrap: wrap; }
        .name-pill { padding: 8px 22px; border-radius: 30px; font-size: 18px; font-weight: 900; }
        .np-old {
          background: var(--c-card-bg); color: var(--c-text-dimmer);
          text-decoration: line-through; text-decoration-color: var(--c-text-dimmer);
          border: 1px solid var(--c-border);
        }
        .np-new {
          background: rgba(26,107,255,0.15); color: #00D4FF;
          border: 1px solid rgba(0,212,255,0.3); font-size: 22px;
          box-shadow: 0 0 30px rgba(0,212,255,0.15);
        }
        .np-arrow { color: var(--c-text-dim); font-size: 22px; }

        /* Ideas */
        .ideas-list { display: flex; flex-direction: column; gap: 10px; margin: 1rem 0; }
        .idea-row { display: grid; grid-template-columns: 1fr 24px 1fr; gap: 8px; align-items: center; }
        .idea-q {
          background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25);
          color: #C4B0FF; border-radius: 10px; padding: 8px 12px;
          font-size: 13px; font-weight: 600; text-align: center;
        }
        .idea-a {
          background: rgba(0,255,178,0.08); border: 1px solid rgba(0,255,178,0.2);
          color: #7AFFDA; border-radius: 10px; padding: 8px 12px;
          font-size: 13px; font-weight: 600; text-align: center;
        }
        .idea-arr { color: var(--c-text-dim); font-size: 16px; text-align: center; }

        /* Feature grid */
        .feat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 1.25rem 0; }
        .feat-item {
          background: var(--c-card-bg); border: 1px solid var(--c-border-light);
          border-radius: 10px; padding: 10px 8px; font-size: 12px;
          color: var(--c-text-dim); text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          transition: background 0.2s, border-color 0.2s;
        }
        .feat-item:hover {
          background: rgba(26,107,255,0.1); border-color: rgba(26,107,255,0.3); color: var(--c-text);
        }
        .feat-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 16px;
          margin: 4rem auto 3rem; max-width: 900px; padding: 0 1.5rem;
        }
        .divider-line { flex: 1; height: 1px; background: linear-gradient(to right, transparent, rgba(26,107,255,0.4), transparent); }
        .divider-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; color: rgba(26,107,255,0.6); }

        /* Future */
        .future-card {
          background: rgba(26,107,255,0.06); border: 1px solid rgba(26,107,255,0.2);
          border-radius: 24px; padding: 3rem 2.5rem;
          position: relative; overflow: hidden; text-align: center;
        }
        .future-mesh {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            radial-gradient(circle at 20% 50%, rgba(26,107,255,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0,212,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 60% 80%, rgba(139,92,246,0.08) 0%, transparent 50%);
        }
        .future-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(26,107,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,107,255,0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .future-title { font-size: 36px; font-weight: 900; margin-bottom: 0.5rem; position: relative; }
        .future-title span {
          background: linear-gradient(135deg, #3D8FFF, #00D4FF);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .future-sub { color: var(--c-text-dim); margin-bottom: 2.5rem; font-size: 15px; position: relative; }
        .future-items { display: flex; flex-direction: column; gap: 16px; margin-bottom: 2.5rem; position: relative; }
        .fi {
          display: flex; align-items: center; gap: 16px;
          background: var(--c-card-bg); border: 1px solid var(--c-border-light);
          border-radius: 14px; padding: 1rem 1.5rem; text-align: right;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .fi:hover {
          background: rgba(26,107,255,0.1); border-color: rgba(26,107,255,0.3); transform: translateX(-4px);
        }
        .fi-num {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(26,107,255,0.15); border: 1px solid rgba(26,107,255,0.3);
          color: #00D4FF; font-size: 14px; font-weight: 900;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .fi-text { font-size: 15px; font-weight: 600; color: var(--c-text-dim); flex: 1; }
        .closing-quote { border-top: 1px solid var(--c-border); padding-top: 2rem; position: relative; }
        .cq-lead { color: var(--c-text-dim); font-size: 15px; margin-bottom: 0.5rem; }
        .cq-main {
          font-size: 28px; font-weight: 900;
          background: linear-gradient(135deg, #3D8FFF, #00D4FF, #00FFB2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          background-size: 200%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        @media (max-width: 600px) {
          .chapter { grid-template-columns: 40px 1fr; gap: 0 1rem; }
          .feat-grid { grid-template-columns: repeat(3, 1fr); }
          .stats-row { grid-template-columns: 1fr; }
          .ch-title { font-size: 20px; }
          .future-title { font-size: 24px; }
          .future-card { padding: 2rem 1.5rem; }
        }
      `}</style>

      {/* ─── TOP BAR ─── */}
      <div className="fixed top-4 z-50 flex items-center gap-2" style={{ left: "1rem" }}>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium backdrop-blur-md transition-colors hover:brightness-150"
          style={{
            border: "1px solid var(--c-border)",
            background: "var(--c-btn-bg)",
            color: "var(--c-text-dim)",
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isAr ? "رجوع" : "Back"}
        </Link>
      </div>

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
          <div className="hero-eyebrow" style={{ justifyContent: "center" }}>
            {isAr ? "قصة · 2024 · من البداية للنهاية" : "Story · 2024 · From Start to Finish"}
          </div>

          <div
            className="mx-auto mb-6"
            style={{
              width: "clamp(80px,16vw,160px)",
              height: "clamp(80px,16vw,160px)",
            }}
          >
            <MedOneXLogoMark
              className={`h-full w-full ${lightMode ? "text-[#1A6BFF]" : "text-[#00D4FF]"}`}
              interactiveColor
            />
          </div>

          <p className="text-lg max-w-md mx-auto" style={{ color: "var(--c-text-dim)" }}>
            {isAr
              ? "من سؤال واحد لطالب طب... إلى نظام تعليمي متكامل"
              : "From one medical student's question... to a complete education system"}
          </p>

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
            <div className="ch-line" />
          </div>
          <div className="ch-card">
            <div className="ch-era">{isAr ? "لحظة التحول الكبير" : "The Big Transformation"}</div>
            <h2 className="ch-title">
              {isAr ? "MedQs مات. MedOneX وُلد." : "MedQs Died. MedOneX Was Born."}
            </h2>
            <div className="stats-row">
              <div className="stat-chip s-blue">
                <div className="stat-num">6+</div>
                <div className="stat-lbl">{isAr ? "محركات AI" : "AI Engines"}</div>
              </div>
              <div className="stat-chip s-purple">
                <div className="stat-num">15+</div>
                <div className="stat-lbl">{isAr ? "ميزة مختلفة" : "Different Features"}</div>
              </div>
              <div className="stat-chip s-teal">
                <div className="stat-num">300+</div>
                <div className="stat-lbl">{isAr ? "تحديث وإصلاح" : "Updates & Fixes"}</div>
              </div>
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
