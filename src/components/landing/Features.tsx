"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/contexts/LocaleContext";
import { SectionHeader } from "./SectionHeader";
import { FEATURES, EASE, VIEWPORT } from "./marketing-data";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

function FeatureCard({ icon: Icon, color, title, desc }: { icon: React.ComponentType<{ className?: string }>; color: string; title: string; desc: string }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover:opacity-80"
        style={{
          background: `linear-gradient(180deg, transparent 25%, ${color}10 60%, ${color}18 100%)`,
        }}
      />
      <div className="relative">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl transition-colors group-hover:text-primary-foreground"
          style={{ background: `${color}20`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

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

      {/* Mobile: horizontal scroll */}
      <div
        className="-mx-6 mt-14 flex gap-5 overflow-x-auto px-6 pb-4 sm:hidden snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
        dir="ltr"
      >
        {FEATURES.map((it, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: EASE, delay: idx * 0.05 }}
            className="snap-start shrink-0 w-[80%]"
          >
            <FeatureCard icon={it.icon} color={it.color} title={items[idx]?.title} desc={items[idx]?.desc} />
          </motion.div>
        ))}
      </div>

      {/* Desktop: grid */}
      <motion.div
        className="mt-14 hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
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
          >
            <FeatureCard icon={it.icon} color={it.color} title={items[idx]?.title} desc={items[idx]?.desc} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
