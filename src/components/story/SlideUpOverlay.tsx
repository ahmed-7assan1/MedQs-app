"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface SlideUpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  dir?: "rtl" | "ltr";
}

export function SlideUpOverlay({ isOpen, onClose, title, children, dir }: SlideUpOverlayProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleEsc]);

  return (
    <div
      className={`slideup-overlay ${isOpen ? "slideup-open" : ""}`}
      onClick={onClose}
      dir={dir}
    >
      <style>{`
        .slideup-overlay {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column; justify-content: flex-end;
          pointer-events: none;
          transition: background 0.4s;
        }
        .slideup-overlay.slideup-open {
          pointer-events: auto;
          background: rgba(0,0,0,0.5);
        }
        .slideup-overlay .slideup-panel {
          background: var(--c-bg);
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          max-height: 95vh;
          overflow-y: auto;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
          will-change: transform;
          backface-visibility: hidden;
        }
        .slideup-overlay.slideup-open .slideup-panel {
          transform: translateY(0);
        }
        .slideup-overlay .slideup-handle {
          width: 36px; height: 4px; border-radius: 999px;
          background: var(--c-text-dimmer); opacity: 0.3;
          margin: 10px auto 0;
          flex-shrink: 0;
        }
        .slideup-overlay .slideup-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--c-border);
        }
        .slideup-overlay .slideup-header-left {
          display: flex; align-items: center; gap: 8px;
        }
        .slideup-overlay .slideup-header-back {
          background: none; border: none; color: var(--c-text-dim);
          cursor: pointer; font-size: 12px; font-weight: 600;
          padding: 4px 8px; border-radius: 8px;
          transition: background 0.2s, color 0.2s;
          display: flex; align-items: center; gap: 4px;
        }
        .slideup-overlay .slideup-header-back:hover {
          background: var(--c-border); color: var(--c-text);
        }
        .slideup-overlay .slideup-header-title {
          font-size: 14px; font-weight: 800; color: var(--c-text);
        }
        .slideup-overlay .slideup-header-close {
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid var(--c-border);
          background: var(--c-btn-bg);
          color: var(--c-text-dim);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s, color 0.2s;
        }
        .slideup-overlay .slideup-header-close:hover {
          background: var(--c-border); color: var(--c-text);
        }
        .slideup-overlay .slideup-body {
          padding: 1rem;
        }
      `}</style>

      <div className="slideup-panel" onClick={(e) => e.stopPropagation()}>
        <div className="slideup-handle" />

        <div className="slideup-header">
          <div className="slideup-header-left">
            <button className="slideup-header-back" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={dir === "rtl" ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
              </svg>
              {dir === "rtl" ? "رجوع" : "Back"}
            </button>
            {title && <span className="slideup-header-title">{title}</span>}
          </div>
          <button className="slideup-header-close" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="slideup-body">{children}</div>
      </div>
    </div>
  );
}
