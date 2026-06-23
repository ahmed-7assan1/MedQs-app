"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { Users, Smartphone, HeartPulse, LifeBuoy, X } from "lucide-react";

interface NavItem {
  route: string;
  icon: typeof Users;
  title: { ar: string; en: string };
  desc: { ar: string; en: string };
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    route: "/story/founders",
    icon: Users,
    title: { ar: "المؤسسون", en: "Founders" },
    desc: { ar: "تعرف على فريق المؤسسين", en: "Meet the founding team" },
    color: "#00D4FF",
  },
  {
    route: "/story/mobile-app",
    icon: Smartphone,
    title: { ar: "تطبيق الموبايل", en: "Mobile App" },
    desc: { ar: "حمل التطبيق واستخدم المنصة في أي وقت", en: "Download the app & use anywhere" },
    color: "#A78BFA",
  },
  {
    route: "/story/teams",
    icon: HeartPulse,
    title: { ar: "الفرق الطبية", en: "Medical Teams" },
    desc: { ar: "استعرض الفرق الطبية على المنصة", en: "Browse medical teams on the platform" },
    color: "#FF6B6B",
  },
  {
    route: "/story/support",
    icon: LifeBuoy,
    title: { ar: "الدعم", en: "Support" },
    desc: { ar: "سياسة الخصوصية، الشروط، تواصل معنا", en: "Privacy, Terms, Contact & FAQ" },
    color: "#00FFB2",
  },
];

interface StoryCapsuleProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryCapsule({ isOpen, onClose }: StoryCapsuleProps) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isRtl = typeof document !== "undefined" ? document.documentElement.dir === "rtl" : false;
  const isLight = typeof document !== "undefined"
    ? document.querySelector(".story-shell.light-mode, .story-page.light-mode, .light-mode") !== null
    : false;

  useEffect(() => { setMounted(true); }, []);

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    setExiting(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleEsc]);

  const navigate = (route: string) => {
    setExiting(true);
    setTimeout(() => {
      onClose();
      router.push(route);
    }, 250);
  };

  return (
    <div
      className={`capsule-full ${isOpen || exiting ? "capsule-full-open" : ""}`}
      onClick={onClose}
    >
      <style>{`
        .capsule-full {
          position: fixed; inset: 0; z-index: 200;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: rgba(0,0,0,0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          pointer-events: none;
          transition: background 0.4s, backdrop-filter 0.4s;
          padding: 1.5rem;
        }
        .capsule-full.capsule-full-open {
          pointer-events: auto;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .capsule-full .cf-inner {
          width: 100%; max-width: 420px;
          transform: scale(0.92) translateY(20px);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
                      opacity 0.35s ease;
          will-change: transform, opacity;
        }
        .capsule-full.capsule-full-open .cf-inner {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
        .cf-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .cf-header-left {
          display: flex; align-items: center; gap: 10px;
        }
        .cf-logo {
          width: 40px; height: 40px; border-radius: 50%;
          border: 1px solid var(--c-border, rgba(255,255,255,0.08));
          background: var(--c-card-bg, rgba(255,255,255,0.04));
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        }
        .cf-title {
          font-size: 18px; font-weight: 900;
          color: var(--c-text, #FFFFFF);
        }
        .cf-close {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid var(--c-border, rgba(255,255,255,0.08));
          background: var(--c-card-bg, rgba(255,255,255,0.04));
          color: var(--c-text-dim, rgba(255,255,255,0.55));
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s;
        }
        .cf-close:hover { background: var(--c-border, rgba(255,255,255,0.08)); }
        .cf-grid {
          display: flex; flex-direction: column; gap: 10px;
        }
        .cf-card {
          display: flex; align-items: center; gap: 14px;
          width: 100%; padding: 1rem 1.25rem;
          border-radius: 20px; border: 1px solid var(--c-border, rgba(255,255,255,0.08));
          background: var(--c-card-bg, rgba(255,255,255,0.04));
          color: var(--c-text, #FFFFFF);
          cursor: pointer; text-align: right;
          backdrop-filter: blur(12px);
          transition: background 0.25s, border-color 0.25s, transform 0.25s;
          position: relative; overflow: hidden;
        }
        .cf-card:hover {
          background: var(--c-card-bg-soft, rgba(255,255,255,0.03));
          border-color: var(--c-border, rgba(255,255,255,0.08));
          transform: translateX(-3px);
        }
        .cf-card:active { transform: scale(0.98); }
        .cf-card-icon {
          width: 48px; height: 48px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .cf-card-text {
          flex: 1; display: flex; flex-direction: column; gap: 3px;
          min-width: 0;
        }
        .cf-card-title { font-size: 15px; font-weight: 700; }
        .cf-card-desc {
          font-size: 12px; color: var(--c-text-dim, rgba(255,255,255,0.55));
        }
        .cf-card-arrow {
          flex-shrink: 0; color: var(--c-text-dimmer, rgba(255,255,255,0.3));
          transition: transform 0.25s;
        }
        .cf-card:hover .cf-card-arrow {
          transform: translateX(-4px);
        }
        .cf-card-glow {
          position: absolute; top: -60%; right: -30%;
          width: 120px; height: 120px; border-radius: 50%;
          pointer-events: none; opacity: 0.08;
          transition: opacity 0.3s;
        }
        .cf-card:hover .cf-card-glow { opacity: 0.15; }
      `}</style>

      <div className="cf-inner" onClick={(e) => e.stopPropagation()}>
        <div className="cf-header">
          <div className="cf-header-left">
            <div className="cf-logo">
              <MedOneXLogoMark
                className={`h-5 w-5 ${mounted && isLight ? "text-black" : "text-white"}`}
                interactiveColor
              />
            </div>
            <span className="cf-title">
              {isRtl ? "القصة الكاملة" : "Complete Story"}
            </span>
          </div>
          <button className="cf-close" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="cf-grid">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                className="cf-card"
                onClick={() => navigate(item.route)}
              >
                <div
                  className="cf-card-icon"
                  style={{
                    background: `${item.color}1A`,
                    color: item.color,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="cf-card-text">
                  <span className="cf-card-title">
                    {isRtl ? item.title.ar : item.title.en}
                  </span>
                  <span className="cf-card-desc">
                    {isRtl ? item.desc.ar : item.desc.en}
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
                  className="cf-card-arrow"
                >
                  <polyline points={isRtl ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
                </svg>
                <div
                  className="cf-card-glow"
                  style={{ background: item.color }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
