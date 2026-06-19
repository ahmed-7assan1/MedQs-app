"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { HOW_IT_WORKS, EASE, VIEWPORT } from "./marketing-data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} subtitle={HOW_IT_WORKS.subtitle} />
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
              className="relative rounded-2xl border border-border bg-background p-6"
            >
              <div className="text-xs font-semibold tracking-widest text-primary">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              {i < HOW_IT_WORKS.steps.length - 1 && (
                <ArrowRight className="absolute right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
