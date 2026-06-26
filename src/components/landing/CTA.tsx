"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { EASE, VIEWPORT } from "./marketing-data";

export function CTA() {
  const { t } = useLocale();
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] md:p-16"
      >
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <h2 className="relative text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {t("cta.title")}
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
          {t("cta.subtitle")}
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <motion.a
            href="/register"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)]"
          >
            {t("cta.primaryCta")}
            <ChevronRight className="h-4 w-4" />
          </motion.a>
          <Link
            href="/auth"
            className="rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-secondary"
          >
            {t("cta.secondaryCta")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
