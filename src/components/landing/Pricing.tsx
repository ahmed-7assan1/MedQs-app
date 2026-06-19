"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "./SectionHeader";
import { PRICING, EASE, VIEWPORT } from "./marketing-data";

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow={PRICING.eyebrow} title={PRICING.title} subtitle={PRICING.subtitle} />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PRICING.plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
            whileHover={{ y: -4 }}
            className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
              p.featured
                ? "border-primary/40 bg-card ring-2 ring-primary/30"
                : "border-border bg-card"
            }`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                Most popular
              </span>
            )}
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="mt-3 flex items-end gap-1">
              <div className="text-4xl font-bold tracking-tight">{p.price}</div>
              {p.period && <div className="pb-1 text-sm text-muted-foreground">{p.period}</div>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-2.5 w-2.5" strokeWidth={4} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-shadow ${
                p.featured
                  ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)] hover:shadow-[0_14px_40px_-10px_hsl(var(--primary)/0.7)]"
                  : "border border-border bg-background hover:bg-secondary"
              }`}
            >
              {p.cta}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
