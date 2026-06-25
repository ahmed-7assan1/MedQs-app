"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { BRANDS, EASE, VIEWPORT } from "./marketing-data";

export function LogosStrip() {
  return (
    <section className="border-y border-border/60 bg-card/40 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.4, ease: EASE }}
          className="text-center text-xs uppercase tracking-widest text-muted-foreground"
        >
          Trusted by students at
        </motion.p>
        <div className="relative mt-6 overflow-hidden">
          <div className="flex w-max animate-marquee gap-16">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight text-muted-foreground"
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
