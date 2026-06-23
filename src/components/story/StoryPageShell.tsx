"use client";

import { useCallback } from "react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { Sun, Moon, Languages } from "lucide-react";

interface StoryPageShellProps {
  children: React.ReactNode;
  pageTitle: { ar: string; en: string };
  lightMode: boolean;
  onToggleTheme: () => void;
  lang: "ar" | "en";
  onToggleLang: () => void;
  onCapsuleOpen: () => void;
  hideTopBar?: boolean;
}

export function StoryPageShell({
  children,
  pageTitle,
  lightMode,
  onToggleTheme,
  lang,
  onToggleLang,
  onCapsuleOpen,
  hideTopBar,
}: StoryPageShellProps) {
  const isAr = lang === "ar";

  return (
    <div
      className={`story-shell ${lightMode ? "light-mode" : ""} ${hideTopBar ? "hide-topbar" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <style>{`
        .story-shell {
          --c-bg: #000000;
          --c-text: #FFFFFF;
          --c-text-dim: rgba(255,255,255,0.55);
          --c-text-dimmer: rgba(255,255,255,0.3);
          --c-border: rgba(255,255,255,0.08);
          --c-border-light: rgba(255,255,255,0.07);
          --c-card-bg: rgba(255,255,255,0.04);
          --c-card-bg-soft: rgba(255,255,255,0.03);
          --c-btn-bg: rgba(6,14,30,0.8);
          --c-shine: rgba(255,255,255,0.15);
          --font-display: "Cairo", "Tajawal", sans-serif;
          font-family: system-ui, -apple-system, sans-serif;
          -webkit-text-size-adjust: 100%;
          background: var(--c-bg);
          color: var(--c-text);
          overflow-x: hidden;
          line-height: 1.7;
          min-height: 100vh;
          position: relative;
          transition: background 0.4s, color 0.4s;
        }
        .story-shell.light-mode {
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
        .story-shell h1,
        .story-shell h2,
        .story-shell h3,
        .story-shell .page-topbar-title,
        .story-shell .page-section-title,
        .story-shell [class*="-title"],
        .story-shell [class*="-name"] {
          font-family: var(--font-display);
        }
        .story-shell .page-topbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 40;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 1rem;
          transition: opacity 0.3s, transform 0.3s;
        }
        .story-shell.hide-topbar .page-topbar {
          opacity: 0; pointer-events: none; transform: translateY(-10px);
        }
        .page-topbar-left {
          display: flex; align-items: center; gap: 10px;
        }
        .page-topbar-logo {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid var(--c-border);
          background: var(--c-btn-bg);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(8px);
          transition: background 0.2s;
        }
        .page-topbar-logo:hover { background: var(--c-border); }
        .page-topbar-title {
          font-size: 15px; font-weight: 800; color: var(--c-text);
        }
        .page-topbar-actions {
          display: flex; align-items: center; gap: 6px;
        }
        .page-topbar-btn {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid var(--c-border);
          background: var(--c-btn-bg);
          color: var(--c-text-dim);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(8px);
          transition: background 0.2s, color 0.2s;
        }
        .page-topbar-btn:hover { background: var(--c-border); color: var(--c-text); }
        .story-shell .page-content {
          padding-top: 4.5rem;
          min-height: 100vh;
        }
        .story-shell .page-section-title {
          font-size: 20px; font-weight: 900; text-align: center;
          margin-bottom: 1.5rem; color: var(--c-text);
        }
      `}</style>

      <div className="page-topbar">
        <div className="page-topbar-left">
          <button className="page-topbar-logo" onClick={onCapsuleOpen} aria-label="Menu">
            <MedOneXLogoMark
              className={`h-4 w-4 ${lightMode ? "text-black" : "text-white"}`}
              interactiveColor
            />
          </button>
          <span className="page-topbar-title">
            {isAr ? pageTitle.ar : pageTitle.en}
          </span>
        </div>
        <div className="page-topbar-actions">
          <button className="page-topbar-btn" onClick={onToggleTheme} aria-label="Toggle theme">
            {lightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button className="page-topbar-btn" onClick={onToggleLang} aria-label="Toggle language">
            <Languages className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="page-content">{children}</div>
    </div>
  );
}
