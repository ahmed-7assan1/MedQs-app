"use client";

import { Star } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { TESTIMONIALS } from "./marketing-data";

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader eyebrow={TESTIMONIALS.eyebrow} title={TESTIMONIALS.title} />
        <div className="relative mt-14 overflow-hidden">
          <div className="flex w-max animate-marquee gap-6" style={{ animationDuration: "50s" }}>
            {[...TESTIMONIALS.quotes, ...TESTIMONIALS.quotes].map((t, i) => (
              <figure
                key={i}
                className="flex w-80 shrink-0 flex-col rounded-2xl border border-border bg-background p-6 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-[0_0_25px_rgba(255,255,255,0.02)] dark:backdrop-blur-sm"
              >
                <div className="flex gap-0.5 text-yellow-500 dark:text-yellow-500">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90 dark:text-foreground/80">
                  &ldquo;{t.q}&rdquo;
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4 dark:border-white/[0.06]">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
