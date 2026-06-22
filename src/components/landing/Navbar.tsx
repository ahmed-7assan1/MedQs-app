"use client";

import { motion } from "framer-motion";
import { ChevronRight, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useThemeStore } from "@/lib/store";
import { NAV_LINKS, EASE } from "./marketing-data";

export function Navbar() {
  const { theme, setTheme } = useThemeStore();
  const { siteName } = useSiteConfig();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative z-30 mx-auto grid max-w-7xl grid-cols-3 items-center px-6 py-5"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20">
          <svg viewBox="0 0 32 32" className="h-6 w-6 shrink-0">
            <defs>
              <linearGradient id="nbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#405a8d" />
                <stop offset="100%" stopColor="#dcdde6" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#nbGrad)" opacity="0.2" />
            <path d="M16 8v16M8 16h16" stroke="url(#nbGrad)" strokeWidth="3" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight">{siteName}</span>
      </div>
      <nav className="hidden items-center justify-center gap-9 text-sm text-muted-foreground md:flex">
        {NAV_LINKS.map((l) => (
          <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="transition-colors hover:text-foreground">
            {l}
          </a>
        ))}
      </nav>
      <div className="flex items-center justify-end gap-2">
        {mounted && (
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:text-foreground hover:shadow-sm"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        <Link href="/auth" className="hidden px-3 py-2 text-sm text-muted-foreground/80 hover:text-foreground sm:inline">
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
        >
          Get started <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.header>
  );
}
