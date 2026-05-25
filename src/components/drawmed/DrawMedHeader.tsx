"use client";

import { useRouter } from "next/navigation";
import { useThemeStore } from "@/lib/store";
import {
  ArrowLeft,
  Menu,
  Sun,
  Moon,
  Monitor,
  BookMarked,
  Sparkles,
  Trash2,
} from "lucide-react";

interface DrawMedHeaderProps {
  onToggleLeftMenu: () => void;
  onToggleLibrary: () => void;
  onOpenCommunityLibraries: () => void;
  onClearCanvas: () => void;
}

export function DrawMedHeader({
  onToggleLeftMenu,
  onToggleLibrary,
  onOpenCommunityLibraries,
  onClearCanvas,
}: DrawMedHeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <div className="drawmed-topbar drawmed-glass drawmed-fade-in">
      {/* Left: back + menu */}
      <div className="drawmed-topbar__section">
        <button onClick={() => router.back()} className="drawmed-topbar__btn" aria-label="Back">
          <ArrowLeft />
        </button>
        <button
          onClick={onToggleLeftMenu}
          className="drawmed-topbar__btn"
          title="Toggle Menu (⌘M)"
          aria-label="Menu"
        >
          <Menu />
        </button>
      </div>

      <div className="drawmed-topbar__divider" />

      {/* Branding */}
      <div className="drawmed-topbar__brand">
        <div className="drawmed-topbar__logo">D</div>
        <div>
          <div className="drawmed-topbar__title">DrawMed</div>
          <div className="drawmed-topbar__subtitle">Whiteboard</div>
        </div>
      </div>

      <div className="drawmed-topbar__divider" />

      {/* Right: actions */}
      <div className="drawmed-topbar__section">
        <button
          onClick={onClearCanvas}
          className="drawmed-topbar__btn"
          title="Clear Canvas"
          style={{ color: 'rgba(239, 68, 68, 0.5)' }}
        >
          <Trash2 />
        </button>

        <button
          onClick={onOpenCommunityLibraries}
          className="drawmed-topbar__btn drawmed-topbar__btn--primary"
          title="Browse Community Libraries"
        >
          <Sparkles />
        </button>

        <button
          onClick={onToggleLibrary}
          className="drawmed-topbar__btn"
          title="My Shapes Library"
        >
          <BookMarked />
        </button>

        <div className="drawmed-topbar__divider" />

        <button
          onClick={cycleTheme}
          className="drawmed-topbar__btn"
          title={`Theme: ${theme}`}
        >
          {theme === "dark" ? (
            <Moon style={{ color: '#a78bfa' }} />
          ) : theme === "light" ? (
            <Sun style={{ color: '#fbbf24' }} />
          ) : (
            <Monitor style={{ color: '#22d3ee' }} />
          )}
        </button>
      </div>
    </div>
  );
}

