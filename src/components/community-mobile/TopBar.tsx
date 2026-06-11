"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  Sun,
  Moon,
  X,
  Sparkle,
} from "@phosphor-icons/react";

interface TopBarProps {
  theme: "dark" | "light";
  searchQuery: string;
  onSearch: (q: string) => void;
  onToggleTheme: () => void;
}

export function TopBar({ theme, searchQuery, onSearch, onToggleTheme }: TopBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-2 pt-2">
      <div className="community-glass rounded-2xl px-4 py-3" style={{ borderRadius: "18px" }}>
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3"
            >
              <MagnifyingGlass size={17} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search posts, people, topics..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)", fontFamily: "inherit" }}
              />
              <button
                onClick={() => { setOpen(false); onSearch(""); }}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{
                  background: "linear-gradient(135deg, #6e40ff, #c44dff, #ff6eb4)"
                }}>
                  <Sparkle size={14} className="text-white" weight="fill" />
                </div>
                <span className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                  MedOneX Community
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
                >
                  <MagnifyingGlass size={17} style={{ color: "var(--text-secondary)" }} />
                </button>
                <button
                  onClick={onToggleTheme}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
                >
                  {theme === "dark" ? (
                    <Sun size={17} style={{ color: "var(--text-secondary)" }} />
                  ) : (
                    <Moon size={17} style={{ color: "var(--text-secondary)" }} />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
