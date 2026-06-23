"use client";

import { useState, useCallback } from "react";
import { StoryPageShell } from "@/components/story/StoryPageShell";
import { useCapsule } from "@/components/story/CapsuleWrapper";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { Download, Zap, Shield, Monitor, Star, Smartphone } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    titleAr: "سريع وآني",
    titleEn: "Lightning Fast",
    descAr: "مُحسَّن للتحميل الفوري والتصفح السلس على أي جهاز",
    descEn: "Optimized for instant loading on any device",
  },
  {
    icon: Shield,
    titleAr: "آمن وخاص",
    titleEn: "Secure & Private",
    descAr: "تشفير كامل لجميع بيانات الدراسة والمراسلات",
    descEn: "End-to-end encryption for all your data",
  },
  {
    icon: Monitor,
    titleAr: "تصفح بدون نت",
    titleEn: "Offline Mode",
    descAr: "حمّل المحاضرات والمواد وشوفها في أي مكان بدون نت",
    descEn: "Download lectures and study offline anywhere",
  },
  {
    icon: Star,
    titleAr: "مدعوم بـ AI",
    titleEn: "AI-Powered",
    descAr: "مساعد Dr. Q AI متاح 24/7 على جوالك",
    descEn: "Dr. Q AI assistant available 24/7 on mobile",
  },
  {
    icon: Smartphone,
    titleAr: "إشعارات ذكية",
    titleEn: "Push Notifications",
    descAr: "تذكيرات دراسة ذكية وتنبيهات فورية",
    descEn: "Smart study reminders and instant alerts",
  },
  {
    icon: Shield,
    titleAr: "متوافق مع الأجهزة اللوحية",
    titleEn: "Tablet Optimized",
    descAr: "تجربة كاملة على iPad والأجهزة اللوحية مع تقسيم الشاشة",
    descEn: "Full iPad & tablet support with split-screen",
  },
];

export default function MobileAppPage() {
  const { setCapsuleOpen } = useCapsule();
  const [lightMode, setLightMode] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const isAr = lang === "ar";
  const toggleLang = useCallback(() => setLang((l) => (l === "en" ? "ar" : "en")), []);

  return (
    <StoryPageShell
      pageTitle={{ ar: "تطبيق الموبايل", en: "Mobile App" }}
      lightMode={lightMode}
      onToggleTheme={() => setLightMode((p) => !p)}
      lang={lang}
      onToggleLang={toggleLang}
      onCapsuleOpen={setCapsuleOpen}
    >
      <style>{`
        .mobile-page { max-width: 640px; margin: 0 auto; padding: 0 1rem 2rem; }
        .mobile-hero {
          display: flex; flex-direction: column; align-items: center;
          padding: 1.5rem 0;
        }
        .phone-mockup-lg {
          position: relative; width: 150px; height: 240px;
          border-radius: 28px; border: 2.5px solid var(--c-border);
          background: var(--c-card-bg);
          overflow: hidden; margin-bottom: 1.25rem;
          flex-shrink: 0;
        }
        .phone-notch-lg {
          position: absolute; top: 10px; left: 50%;
          transform: translateX(-50%);
          width: 50px; height: 6px; border-radius: 999px;
          background: var(--c-border); z-index: 2;
        }
        .phone-screen-lg {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem 0.5rem;
        }
        .phone-screen-lg .phone-content {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; text-align: center;
        }
        .phone-screen-lg .phone-app-name {
          font-size: 12px; font-weight: 800; color: var(--c-text);
        }
        .phone-screen-lg .phone-app-tag {
          font-size: 8px; font-weight: 600;
          color: var(--c-text-dimmer); text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .phone-screen-lg .phone-dots {
          display: flex; gap: 4px; margin-top: 6px;
        }
        .phone-screen-lg .phone-dots span {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--c-text-dimmer); opacity: 0.4;
        }
        .download-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 800;
          padding: 0.8rem 2rem; border-radius: 999px;
          background: linear-gradient(135deg, #00D4FF, #0099CC);
          color: #000; text-decoration: none;
          margin-bottom: 2rem;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 20px rgba(0,212,255,0.3);
        }
        .download-btn:hover { opacity: 0.9; transform: scale(1.03); }
        .features-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .feature-card {
          padding: 1rem; border-radius: 20px;
          border: 1px solid var(--c-border);
          background: var(--c-card-bg);
          backdrop-filter: blur(12px);
        }
        .feature-icon {
          width: 36px; height: 36px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,212,255,0.1); color: #00D4FF;
          margin-bottom: 8px;
        }
        .feature-title { font-size: 13px; font-weight: 700; color: var(--c-text); margin-bottom: 4px; }
        .feature-desc { font-size: 11px; line-height: 1.5; color: var(--c-text-dim); }
      `}</style>

      <div className="mobile-page">
        <div className="mobile-hero">
          <div className="phone-mockup-lg">
            <div className="phone-notch-lg" />
            <div className="phone-screen-lg">
              <div className="phone-content">
                <MedOneXLogoMark className="h-7 w-7 text-white" interactiveColor />
                <span className="phone-app-name">MedOneX</span>
                <span className="phone-app-tag">{isAr ? "تعلم بذكاء" : "Learn Smarter"}</span>
                <div className="phone-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>

          <a href="/download" className="download-btn" target="_blank" rel="noopener noreferrer">
            <Download className="h-5 w-5" />
            {isAr ? "تحميل التطبيق" : "Download App"}
          </a>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="feature-card">
                <div className="feature-icon">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="feature-title">
                  {isAr ? f.titleAr : f.titleEn}
                </div>
                <div className="feature-desc">
                  {isAr ? f.descAr : f.descEn}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StoryPageShell>
  );
}
