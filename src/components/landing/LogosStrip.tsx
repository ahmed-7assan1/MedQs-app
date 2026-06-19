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
        <div className="mt-6 grid grid-cols-3 items-center gap-6 sm:grid-cols-6">
          {BRANDS.map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 0.8, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
              whileHover={{ opacity: 1, y: -2 }}
              className="flex items-center justify-center gap-2 text-center text-sm font-bold tracking-tight text-muted-foreground"
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              {b}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
