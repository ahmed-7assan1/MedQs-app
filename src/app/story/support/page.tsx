"use client";

import { useState, useCallback } from "react";
import { StoryPageShell } from "@/components/story/StoryPageShell";
import { SlideUpOverlay } from "@/components/story/SlideUpOverlay";
import { useCapsule } from "@/components/story/CapsuleWrapper";
import { Shield, LifeBuoy, Users, Smartphone } from "lucide-react";

const SUPPORT_ITEMS: {
  key: string;
  icon: typeof Shield;
  title: { ar: string; en: string };
  content: { ar: string[]; en: string[] };
}[] = [
  {
    key: "privacy",
    icon: Shield,
    title: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    content: {
      ar: [
        "نحن في MedOneX نلتزم بحماية خصوصية مستخدمينا.",
        "يتم جمع البيانات الشخصية فقط عند التسجيل أو استخدام الخدمة.",
        "لا نشارك معلوماتك مع أطراف ثالثة دون موافقتك.",
        "يمكنك طلب حذف بياناتك في أي وقت من خلال التواصل مع فريق الدعم.",
        "نستخدم تشفير SSL لحماية بياناتك أثناء النقل.",
      ],
      en: [
        "At MedOneX, we are committed to protecting your privacy.",
        "Personal data is collected only during registration or service use.",
        "We do not share your information with third parties without consent.",
        "You can request deletion of your data at any time by contacting support.",
        "We use SSL encryption to protect your data during transmission.",
      ],
    },
  },
  {
    key: "terms",
    icon: LifeBuoy,
    title: { ar: "شروط الاستخدام", en: "Terms of Service" },
    content: {
      ar: [
        "باستخدامك للمنصة توافق على الالتزام بشروط الاستخدام.",
        "الحساب خاص بك ولا يحق لك مشاركته مع أي شخص آخر.",
        "ممنوع نشر أي محتوى مخالف للقيم أو القوانين.",
        "نحتفظ بالحق في تعليق أي حساب ينتهك هذه الشروط.",
        "يتم تحديث الشروط بشكل دوري وسيتم إشعارك بأي تغييرات جوهرية.",
      ],
      en: [
        "By using the platform, you agree to abide by these terms.",
        "Your account is personal and may not be shared with anyone else.",
        "Publishing content that violates laws or values is prohibited.",
        "We reserve the right to suspend any account that violates these terms.",
        "Terms are updated periodically and you will be notified of material changes.",
      ],
    },
  },
  {
    key: "contact",
    icon: Users,
    title: { ar: "تواصل معنا", en: "Contact Us" },
    content: {
      ar: [
        "يمكنك التواصل مع فريق الدعم عبر البريد الإلكتروني.",
        "بريد الدعم: support@medonex.com",
        "نسعى للرد على جميع الاستفسارات خلال 24 ساعة.",
        "للاستفسارات التقنية: tech@medonex.com",
        "تابعنا على وسائل التواصل الاجتماعي لأحدث التحديثات.",
      ],
      en: [
        "You can reach our support team via email.",
        "Support email: support@medonex.com",
        "We aim to respond to all inquiries within 24 hours.",
        "Technical inquiries: tech@medonex.com",
        "Follow us on social media for the latest updates.",
      ],
    },
  },
  {
    key: "faq",
    icon: Smartphone,
    title: { ar: "الأسئلة الشائعة", en: "FAQ" },
    content: {
      ar: [
        "س: كيف يمكنني إنشاء حساب؟ ج: سجل باستخدام بريدك الإلكتروني أو عبر حسابات التواصل الاجتماعي.",
        "س: هل المنصة مجانية؟ ج: نعم، جميع الخدمات الأساسية مجانية.",
        "س: كيف يمكنني الانضمام لفريق طبي؟ ج: تصفح الفرق المتاحة وقدم طلب الانضمام.",
        "س: هل يمكنني استخدام التطبيق بدون اتصال؟ ج: نعم، يمكنك تحميل المحاضرات للتصفح بدون نت.",
        "س: كيف يمكنني حذف حسابي؟ ج: تواصل مع فريق الدعم لطلب حذف الحساب.",
      ],
      en: [
        "Q: How do I create an account? A: Sign up with your email or social accounts.",
        "Q: Is the platform free? A: Yes, all basic services are free.",
        "Q: How do I join a medical team? A: Browse available teams and submit a request.",
        "Q: Can I use the app offline? A: Yes, you can download lectures for offline viewing.",
        "Q: How do I delete my account? A: Contact our support team to request deletion.",
      ],
    },
  },
];

export default function SupportPage() {
  const { setCapsuleOpen } = useCapsule();
  const [lightMode, setLightMode] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const isAr = lang === "ar";
  const toggleLang = useCallback(() => setLang((l) => (l === "en" ? "ar" : "en")), []);
  const selectedItem = SUPPORT_ITEMS.find((s) => s.key === selectedKey);

  return (
    <StoryPageShell
      pageTitle={{ ar: "الدعم", en: "Support" }}
      lightMode={lightMode}
      onToggleTheme={() => setLightMode((p) => !p)}
      lang={lang}
      onToggleLang={toggleLang}
      onCapsuleOpen={setCapsuleOpen}
      hideTopBar={!!selectedKey}
    >
      <style>{`
        .support-page { max-width: 640px; margin: 0 auto; padding: 0 1rem 2rem; }
        .support-list { display: flex; flex-direction: column; gap: 8px; }
        .support-card {
          display: flex; align-items: center; gap: 14px;
          width: 100%; padding: 1rem 1.25rem;
          border-radius: 20px; border: 1px solid var(--c-border);
          background: var(--c-card-bg);
          cursor: pointer; text-align: right;
          backdrop-filter: blur(12px);
          transition: transform 0.25s, border-color 0.25s;
        }
        .support-card:hover { transform: translateX(-3px); border-color: rgba(168,85,247,0.2); }
        .support-card:active { transform: scale(0.98); }
        .support-card-icon {
          width: 48px; height: 48px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          background: rgba(168,85,247,0.1); color: #a855f7;
        }
        .support-card-text { flex: 1; min-width: 0; }
        .support-card-title { font-size: 15px; font-weight: 700; color: var(--c-text); }
        .support-card-arrow {
          flex-shrink: 0; color: var(--c-text-dimmer);
          transition: transform 0.25s;
        }
        .support-card:hover .support-card-arrow { transform: translateX(-4px); }

        /* overlay detail */
        .support-detail { padding-bottom: 1rem; }
        .support-detail-title {
          font-size: 20px; font-weight: 900; color: var(--c-text);
          margin-bottom: 1rem; text-align: center;
        }
        .support-detail-content { display: flex; flex-direction: column; gap: 12px; }
        .support-detail-content p {
          font-size: 14px; line-height: 1.7;
          color: var(--c-text-dim); margin: 0;
        }
      `}</style>

      <div className="support-page">
        <div className="support-list">
          {SUPPORT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className="support-card"
                onClick={() => setSelectedKey(item.key)}
              >
                <div className="support-card-icon">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="support-card-text">
                  <span className="support-card-title">
                    {isAr ? item.title.ar : item.title.en}
                  </span>
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="support-card-arrow"
                >
                  <polyline points={isAr ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      <SlideUpOverlay
        isOpen={!!selectedKey}
        onClose={() => setSelectedKey(null)}
        title={isAr ? "الدعم" : "Support"}
        dir={isAr ? "rtl" : "ltr"}
      >
        {selectedItem && (
          <div className="support-detail">
            <h2 className="support-detail-title">
              {isAr ? selectedItem.title.ar : selectedItem.title.en}
            </h2>
            <div className="support-detail-content">
              {(isAr ? selectedItem.content.ar : selectedItem.content.en).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </SlideUpOverlay>
    </StoryPageShell>
  );
}
