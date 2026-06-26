"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/contexts/LocaleContext";
import { SectionHeader } from "./SectionHeader";
import { FEATURES, EASE, VIEWPORT } from "./marketing-data";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Features() {
  const { t } = useLocale();
  const items = t("features.items") as { title: string; desc: string }[];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow={t("features.eyebrow")}
        title={t("features.title")}
        subtitle={t("features.subtitle")}
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
        {FEATURES.map((it, idx) => (
          <motion.div
            key={idx}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover:opacity-80"
              style={{
                background: `linear-gradient(180deg, transparent 25%, ${it.color}10 60%, ${it.color}18 100%)`,
              }}
            />
            <div className="relative">
              <div
                className="grid h-11 w-11 place-items-center rounded-xl transition-colors group-hover:text-primary-foreground"
                style={{ background: `${it.color}20`, color: it.color }}
              >
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{items[idx]?.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{items[idx]?.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
