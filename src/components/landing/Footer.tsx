"use client";

import { Twitter, Github, Linkedin } from "lucide-react";
import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { FOOTER } from "./marketing-data";

export function Footer() {
  const { siteName } = useSiteConfig();
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20">
              <svg viewBox="0 0 32 32" className="h-6 w-6 shrink-0">
                <defs>
                  <linearGradient id="ftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#405a8d" />
                    <stop offset="100%" stopColor="#dcdde6" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#ftGrad)" opacity="0.5" />
                <path d="M16 8v16M8 16h16" stroke="url(#ftGrad)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">{siteName}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{FOOTER.tagline}</p>
          <div className="mt-5 flex gap-2">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {FOOTER.columns.map((c) => (
          <div key={c.title}>
            <div className="text-sm font-semibold">{c.title}</div>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} {FOOTER.copyright}</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
