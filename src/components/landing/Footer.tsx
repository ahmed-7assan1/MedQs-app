"use client";

import { Twitter, Github, Linkedin } from "lucide-react";
import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useLocale } from "@/contexts/LocaleContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";

export function Footer() {
  const { siteName } = useSiteConfig();
  const { t, locale } = useLocale();
  const footerColumns = t("footer.columns") as { title: string; links: { label: string; href: string }[] }[];
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
            <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <MedOneXLogoMark className="h-6 w-6 shrink-0 text-primary" interactiveColor />
            </div>
            <span className="text-lg font-semibold tracking-tight">{siteName}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("footer.tagline")}</p>
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
        {footerColumns.map((c) => (
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
          <div>© {new Date().getFullYear()} {t("footer.copyright")}</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">{t("footer.privacy")}</Link>
            <Link href="/terms" className="hover:text-foreground">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
