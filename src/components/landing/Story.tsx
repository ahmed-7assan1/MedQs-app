"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { ArrowDown, GitCommit, AlertTriangle, Quote } from "lucide-react";
import { CHAPTERS, BRAND_VALUES, type Chapter } from "./story-data";
import { EASE, VIEWPORT } from "./marketing-data";

const GRADIENT = "from-[#405a8d] to-[#dcdde6]";

function badgeColor(type: "triumph" | "struggle" | "pivot") {
  switch (type) {
    case "triumph": return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "struggle": return "border-red-500/30 bg-red-500/10 text-red-400";
    case "pivot": return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
}

function badgeLabel(type: "triumph" | "struggle" | "pivot") {
  switch (type) {
    case "triumph": return "▲ Triumph";
    case "struggle": return "✕ Struggle";
    case "pivot": return "→ Pivot";
  }
}

function TimelineCard({ chapter, index }: { chapter: Chapter; index: number }) {
  const Icon = chapter.icon;
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, ease: EASE }}
      className={`relative flex w-full items-start gap-6 md:gap-12 ${
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      {/* Card */}
      <div className={`flex-1 ${isLeft ? "md:text-right" : "md:text-left"}`}>
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-xl md:p-8">
          {/* Chapter number */}
          <div className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground ${isLeft ? "md:justify-end" : ""}`}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
              Chapter {index + 1}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${GRADIENT} px-2.5 py-1 text-xs font-medium text-white">
              {chapter.period}
            </span>
          </div>

          {/* Icon + Title */}
          <div className={`mb-3 flex items-center gap-3 ${isLeft ? "md:flex-row-reverse" : ""}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${GRADIENT} text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{chapter.title}</h3>
              <p className="text-sm text-muted-foreground/70">{chapter.subtitle}</p>
            </div>
          </div>

          {/* Narrative */}
          <p className={`mb-4 text-sm leading-relaxed text-muted-foreground ${isLeft ? "md:text-left" : ""}`}>
            {chapter.narrative}
          </p>

          {/* Struggle */}
          <div className={`mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 ${isLeft ? "md:flex-row-reverse md:text-left" : ""}`}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-xs leading-relaxed text-red-300/80">{chapter.struggle}</p>
          </div>

          {/* Key Commits */}
          <div>
            <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${isLeft ? "md:justify-end" : ""}`}>
              <GitCommit className="h-3 w-3" />
              Key commits
            </div>
            <div className={`flex flex-wrap gap-1.5 ${isLeft ? "md:justify-end" : ""}`}>
              {chapter.milestones.map((m) => (
                <span
                  key={m.commit}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${badgeColor(m.type)}`}
                >
                  {badgeLabel(m.type)}
                  <span className="max-w-[180px] truncate">{m.commit}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Commit count */}
          <div className={`mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground/60 ${isLeft ? "text-right" : ""}`}>
            {chapter.commitCount} commits in this chapter
          </div>
        </div>
      </div>

      {/* Desktop dot */}
      <div className="hidden md:flex md:flex-col md:items-center md:pt-6">
        <div className="z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${GRADIENT} shadow-lg">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
      </div>

      {/* Spacer for alternating layout */}
      <div className="hidden flex-1 md:block" />
    </motion.div>
  );
}

export function Story() {
  const { siteName } = useSiteConfig();
  const topRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const scrollToTimeline = () => {
    timelineRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" ref={topRef}>
      {/* ─── HERO ─── */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#405a8d]/10 via-transparent to-background" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#405a8d]/20 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center justify-center">
            <MedOneXLogoMark className="h-16 w-16 text-primary md:h-20 md:w-20" interactiveColor />
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            The{" "}
            <span className="bg-gradient-to-r from-[#405a8d] to-[#dcdde6] bg-clip-text text-transparent">
              Real Story
            </span>{" "}
            of {siteName}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Not a marketing fable. The unfiltered engineering journey from a single
            deploy commit to a medical education platform serving thousands — with
            every build error, redirect loop, and 3 AM breakthrough included.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/60">
            <span className="rounded-full border border-border bg-card px-3 py-1">~300 commits</span>
            <span className="rounded-full border border-border bg-card px-3 py-1">80 days</span>
            <span className="rounded-full border border-border bg-card px-3 py-1">6 chapters</span>
          </div>

          <motion.button
            onClick={scrollToTimeline}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-10 inline-flex items-center gap-2 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            Scroll to explore <ArrowDown className="h-3 w-3" />
          </motion.button>
        </motion.div>
      </section>

      {/* ─── TIMELINE ─── */}
      <section ref={timelineRef} className="relative px-6 py-20 md:py-32">
        {/* Center line */}
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#405a8d] via-[#405a8d]/50 to-transparent md:block" />

        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              The Timeline
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every chapter, every struggle, every shipped feature
            </p>
          </motion.div>

          <div className="relative space-y-16 md:space-y-24">
            {CHAPTERS.map((chapter, i) => (
              <TimelineCard key={chapter.id} chapter={chapter} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── BRAND VALUES ─── */}
      <section className="relative border-t border-border px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              What We Believe
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These aren&apos;t corporate values. They&apos;re scars.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BRAND_VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT}
                  transition={{ duration: 0.4, ease: EASE, delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg"
                >
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${v.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: v.color }} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {v.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FUTURE ─── */}
      <section className="relative overflow-hidden border-t border-border px-6 py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#405a8d]/5 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#405a8d]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Quote className="h-3 w-3" />
              What&apos;s next
            </div>

            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              The Story Isn&apos;t Over
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Every commit is a sentence. Every build error is a plot twist.
              The Telegram bot is still learning. The AI is still listening.
              The landing page will probably be redesigned again tomorrow.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground/60">
              This repository is alive. The next chapter hasn&apos;t been written yet —
              and that&apos;s exactly how it should be.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
