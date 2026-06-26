"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { FEATURES, EASE, VIEWPORT } from "./marketing-data";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Features"
        title={<>Everything you need, <span className="text-muted-foreground/70">nothing you don&apos;t</span></>}
        subtitle="A focused toolkit for mastering medicine — from AI tutoring to past papers."
      />
      <motion.div
        className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={{
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {FEATURES.map((it) => (
          <motion.div
            key={it.title}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="grid h-11 w-11 place-items-center rounded-xl transition-colors group-hover:text-primary-foreground"
              style={{ background: `${it.color}20`, color: it.color }}
            >
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{it.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
