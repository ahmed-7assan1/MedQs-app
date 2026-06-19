"use client";

import { motion, type Variants } from "framer-motion";
import { Sparkles, Check, Pin, Calendar, Bell, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Brain } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease, delay: i * 0.06 },
  }),
};

const floatIn = (x: number, y: number, rot: number): Variants => ({
  hidden: { opacity: 0, x, y, rotate: rot * 1.6, scale: 0.9 },
  show: {
    opacity: 1, x: 0, y: 0, rotate: rot, scale: 1,
    transition: { duration: 0.7, ease, delay: 0.2 },
  },
});

function FloatChip({ icon: Icon, label, className, variants, tone = "card" }: {
  icon: LucideIcon; label: string; className: string; variants: Variants; tone?: "card" | "note" | "primary";
}) {
  const tones = {
    card: "bg-card text-foreground border-border",
    note: "bg-amber-800/60 text-amber-100 border-amber-700/40",
    primary: "bg-primary text-primary-foreground border-transparent",
  };
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      className={`pointer-events-none absolute hidden items-center gap-2 rounded-2xl border px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] md:flex ${tones[tone]} ${className}`}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
      <span className="text-sm font-medium">{label}</span>
    </motion.div>
  );
}

export function NewAuthShell({ eyebrow, title, subtitle, footer, children }: {
  eyebrow: string; title: string; subtitle: string; footer: ReactNode; children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease }}
        className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary/80 to-primary">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">MedOneX</span>
        </Link>
        <Link href="/" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          Back to home
        </Link>
      </motion.header>

      <FloatChip icon={Sparkles} label="AI-Powered Learning" variants={floatIn(-60, -30, -6)} tone="note" className="left-[6%] top-[18%]" />
      <FloatChip icon={Check} label="50K+ MCQ Bank" variants={floatIn(-40, 40, 4)} tone="card" className="left-[4%] bottom-[18%]" />
      <FloatChip icon={Pin} label="Personalized Study Plan" variants={floatIn(60, -40, 5)} tone="card" className="right-[6%] top-[14%]" />
      <FloatChip icon={Bell} label="Smart Reminders" variants={floatIn(70, 30, -4)} tone="primary" className="right-[4%] bottom-[22%]" />
      <FloatChip icon={Calendar} label="Exam Schedule Sync" variants={floatIn(50, 60, 6)} tone="card" className="right-[14%] bottom-[8%]" />

      <main className="relative z-10 mx-auto flex max-w-7xl items-center justify-center px-6 pb-20 pt-6 md:pt-10">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-10">
            <motion.p variants={fadeUp} custom={2} className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </motion.p>
            <motion.h1 variants={fadeUp} custom={3} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </motion.h1>
            <motion.p variants={fadeUp} custom={4} className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </motion.p>
            <motion.div variants={fadeUp} custom={5} className="mt-8">
              {children}
            </motion.div>
          </div>
          <motion.p variants={fadeUp} custom={7} className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
