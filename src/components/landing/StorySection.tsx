"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Lightbulb, Heart, Shield, Users, Star } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { BRAND_VALUES } from "./story-data";
import { EASE, VIEWPORT } from "./marketing-data";

interface Milestone {
  year: string;
  label: string;
  title: string;
  body: string;
  quote: string;
  color: string;
}

const MILESTONES_DATA: Omit<Milestone, "label" | "title" | "body" | "quote">[] = [
  { year: "2024", color: "#1A6BFF" },
  { year: "2025", color: "#FF6B6B" },
  { year: "2026", color: "#8B5CF6" },
  { year: "2026", color: "#FBBF24" },
];

const BRAND_ICONS = [Lightbulb, Heart, Shield, Users, Star];

function MilestoneCard({ m, index, mt }: { m: Milestone; index: number; mt: { label: string; title: string; body: string; quote: string } }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.1 }}
      className="group relative flex gap-3 md:gap-4"
    >
      <div className="flex w-10 shrink-0 flex-col items-center md:w-11">
        <div
          className="h-3.5 w-3.5 rounded-full border-2 border-background shadow-lg md:h-4 md:w-4"
          style={{
            backgroundColor: m.color,
            boxShadow: `0 0 10px ${m.color}60`,
          }}
        />
        <span className="mt-1 text-[10px] font-bold tracking-wider text-muted-foreground">
          {m.year}
        </span>
      </div>

      <div
        onClick={() => setExpanded((p) => !p)}
        className="relative flex-1 cursor-pointer rounded-2xl border border-border bg-card/40 p-4 transition-shadow duration-300 hover:shadow-lg md:p-5"
      >
        <div
          className="absolute top-2 w-[3px] rounded-full opacity-60"
          style={{
            backgroundColor: m.color,
            insetInlineStart: 0,
            height: "calc(100% - 1rem)",
          }}
        />

        <span className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: m.color }}>
          {mt.label}
        </span>

        <h3 className="mt-1 text-base font-bold md:text-lg">{mt.title}</h3>

        <p className={`mt-2 text-sm leading-relaxed text-muted-foreground transition-opacity ${expanded ? "" : "line-clamp-2"}`}>
          {mt.body}
        </p>

        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: expanded ? 300 : 0,
            opacity: expanded ? 1 : 0,
          }}
        >
          <div
            className="mt-3 rounded-lg p-3 text-sm font-semibold leading-relaxed"
            style={{
              backgroundColor: `${m.color}12`,
              borderInlineStart: `3px solid ${m.color}`,
            }}
          >
            ❝ {mt.quote} ❞
          </div>
        </div>

        <span
          className="mt-2 inline-block cursor-pointer text-xs font-semibold transition-all hover:opacity-80"
          style={{ color: m.color }}
        >
          {expanded ? t("story.showLess") : t("story.showMore")}
        </span>
      </div>
    </motion.div>
  );
}

function BrandValues() {
  const { locale } = useLocale();
  return (
    <div className="mx-auto mt-20 max-w-5xl">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.4, ease: EASE }}
        className="mb-8 text-center text-[10px] font-bold uppercase tracking-[3px] text-muted-foreground"
      >
        {locale === "ar" ? "Brand Values — قيم العلامة" : "Brand Values — Our Values"}
      </motion.p>

      <motion.div
        className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4"
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {BRAND_VALUES.map((bv, i) => {
          const Icon = BRAND_ICONS[i] || Star;
          return (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
              }}
              className="group rounded-xl border border-border bg-card/30 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
            >
              <div
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${bv.color}20` }}
              >
                <Icon className="h-4 w-4" style={{ color: bv.color }} />
              </div>
              <h4 className="mt-3 text-xs font-bold">{locale === "ar" ? bv.titleAr : bv.title}</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {locale === "ar" ? bv.descAr : bv.desc}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export function StorySection() {
  const { t, locale } = useLocale();
  const milestones = t("story.milestones") as { label: string; title: string; body: string; quote: string }[];
  const isRtl = locale === "ar";

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className={`bg-card/40 py-24 ${isRtl ? "font-arabic" : ""}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.4, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            <Star className="h-3 w-3 text-primary" />
            {t("story.eyebrow")}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
            className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            dangerouslySetInnerHTML={{ __html: t("story.title") }}
          />
        </div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <div
            className="absolute inset-y-0 w-px bg-gradient-to-b from-primary/30 via-border to-transparent"
            style={{ insetInlineStart: isRtl ? "20px" : "20px" }}
          />

          <div className="space-y-10 md:space-y-12">
            {MILESTONES_DATA.map((m, i) => (
              <MilestoneCard key={i} m={{ ...m, label: "", title: "", body: "", quote: "" }} index={i} mt={milestones[i] || { label: "", title: "", body: "", quote: "" }} />
            ))}
          </div>
        </div>

        <BrandValues />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link
            href="/story"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md"
          >
            {t("story.cta")}
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
