"use client";

import { motion } from "framer-motion";
import { ChevronRight, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
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
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <MedOneXLogoMark className="h-6 w-6 shrink-0 text-primary" interactiveColor />
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
