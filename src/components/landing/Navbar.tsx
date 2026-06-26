"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sun, Moon, Play, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { useThemeStore } from "@/lib/store";
import { useLocale } from "@/contexts/LocaleContext";
import { EASE } from "./marketing-data";

const EXCLUDED_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/complete-profile", "/auth"];

export function Navbar() {
  const { theme, setTheme } = useThemeStore();
  const { siteName } = useSiteConfig();
  const { locale, setLocale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [resumePath, setResumePath] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const lastPath = localStorage.getItem("medqs-last-path");
    if (lastPath && !EXCLUDED_PATHS.includes(lastPath)) {
      const timer = setTimeout(() => {
        setResumePath(lastPath);
        setShowResume(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    if (!showResume) return;
    const handleScroll = () => { if (window.scrollY > 50) setShowResume(false); };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showResume]);

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mx-auto mt-3 w-[min(1200px,calc(100vw-32px))] flex flex-col rounded-2xl border border-border/40 bg-background/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] supports-[backdrop-filter]:bg-background/60 pointer-events-auto"
      >
        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-2">
            <MedOneXLogoMark className="h-8 w-8 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
            <div className="flex items-center gap-2">
              <div className="h-6 w-px bg-[#49495A] dark:bg-white/20" />
              <span className="text-[15px] font-bold tracking-tight text-[#13171E] dark:text-white mt-0.5">{siteName}</span>
            </div>
          </div>
          <nav className="hidden items-center justify-center gap-9 text-sm text-muted-foreground md:flex">
            {(t("nav.links") as { label: string; href: string }[]).map((l) =>
              l.href.startsWith("/") ? (
                <Link key={l.label} href={l.href} className="transition-colors hover:text-foreground">{l.label}</Link>
              ) : (
                <a key={l.label} href={l.href} className="transition-colors hover:text-foreground">{l.label}</a>
              )
            )}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <Link href="/auth" className="hidden px-3 py-2 text-sm text-muted-foreground/80 hover:text-foreground md:inline">
              {t("nav.signIn")}
            </Link>
            <Link
              href="/register"
              className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md md:inline-flex"
            >
              {t("nav.getStarted")} <ChevronRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              aria-label="Toggle language"
              className="grid h-9 w-9 shrink-0 place-items-center text-xs font-bold tracking-wider text-muted-foreground transition-all hover:text-foreground md:rounded-full md:border md:border-border md:bg-card md:hover:shadow-sm"
            >
              {locale === "ar" ? "EN" : "ع"}
            </button>
            {mounted && (
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-all hover:text-foreground md:rounded-full md:border md:border-border md:bg-card md:hover:shadow-sm"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-all hover:text-foreground md:rounded-full md:border md:border-border md:bg-card md:hover:shadow-sm md:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden md:hidden"
            >
              <div className="border-t border-border/40 px-5 py-4 space-y-2">
                {(t("nav.links") as { label: string; href: string }[]).map((l) =>
                  l.href.startsWith("/") ? (
                    <Link
                      key={l.label}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      key={l.label}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  )
                )}
                <hr className="border-border/40 my-2" />
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {t("nav.signIn")}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResume && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 border-t border-border/40 px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Play className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-medium truncate">{t("nav.resumeSession")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowResume(false)}
                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("nav.dismiss")}
                  </button>
                  <button
                    onClick={() => {
                      setShowResume(false);
                      router.push(resumePath);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:opacity-90"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {t("nav.resume")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}