"use client";
import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { Facebook, Twitter, Youtube, Instagram, Send, Phone } from "lucide-react";

/**
 * Legal + trust links on every student-facing page (inside main shell).
 */
export function SiteFooter() {
  const { siteName = "MedQs", facebookUrl, twitterUrl, youtubeUrl, instagramUrl, telegramUrl, whatsappUrl, hulkLogoUrl } = useSiteConfig();
  const year = new Date().getFullYear();
  return (
    <footer
      className="mt-auto border-t border-border/80 bg-slate-50/50 dark:bg-muted/10 px-4 py-8 md:px-8"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{siteName}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Medical education platform for students and doctors. AI answers are for study only — not a substitute for
            your course doctors or clinical supervision.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" aria-label="Legal">
          <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground transition-colors hover:text-primary">
            Terms
          </Link>
          <Link href="/dashboard-app" className="text-muted-foreground transition-colors hover:text-primary">
            Dashboard
          </Link>
        </nav>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center justify-between border-t border-border/40 pt-6">
        <p className="text-[11px] text-muted-foreground/80">
          © {year} {siteName}. All rights reserved.
        </p>

        <div className="flex items-center gap-4 text-muted-foreground">
          {facebookUrl && (
            <a href={facebookUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Facebook className="w-4 h-4" /></a>
          )}
          {twitterUrl && (
            <a href={twitterUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Twitter className="w-4 h-4" /></a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Instagram className="w-4 h-4" /></a>
          )}
          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Youtube className="w-4 h-4" /></a>
          )}
          {telegramUrl && (
            <a href={telegramUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Send className="w-4 h-4" /></a>
          )}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Phone className="w-4 h-4" /></a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Created by DR.HULK</span>
          {hulkLogoUrl && (
            <img src={hulkLogoUrl} alt="Dr. Hulk" className="w-6 h-6 object-contain rounded-sm" />
          )}
        </div>
      </div>
    </footer>
  );
}
