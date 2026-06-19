"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { TESTIMONIALS, EASE, VIEWPORT } from "./marketing-data";

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader eyebrow={TESTIMONIALS.eyebrow} title={TESTIMONIALS.title} />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.quotes.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
              className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-sm"
            >
              <div className="flex gap-0.5 text-yellow-500">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.q}&rdquo;
              </blockquote>
              <figcaption className="mt-5 border-t border-border pt-4">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
