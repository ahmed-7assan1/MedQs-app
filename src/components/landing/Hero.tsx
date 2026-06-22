"use client";

import { motion, type Variants } from "framer-motion";
import { ChevronRight, Check, Pin, Timer, Calendar, Brain, Sparkles, Play, Star, BookOpen } from "lucide-react";
import Link from "next/link";
import { HERO, EASE } from "./marketing-data";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, delay: i * 0.06 },
  }),
};

const floatIn = (x: number, y: number, rot: number): Variants => ({
  hidden: { opacity: 0, x, y, rotate: rot * 1.6, scale: 0.9 },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: rot,
    scale: 1,
    transition: { duration: 0.7, ease: EASE, delay: 0.15 },
  },
});

function StickyNote() {
  return (
    <motion.div
      variants={floatIn(-60, -30, -8)}
      initial="hidden"
      animate="show"
      whileHover={{ rotate: -4, y: -4 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="absolute left-2 top-4 z-10 hidden sm:block md:left-10"
    >
      <div className="relative w-48 rotate-[-8deg] rounded-sm bg-amber-800/60 p-4 text-amber-100 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.25)]">
        <Pin className="absolute -top-2 left-1/2 h-5 w-5 -translate-x-1/2 rotate-12 fill-destructive text-destructive drop-shadow" />
        <p className="text-[13px] leading-snug" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
          AI generates concise notes from every lecture. Save hours of study time.
        </p>
      </div>
    </motion.div>
  );
}

function CheckCard() {
  return (
    <motion.div
      variants={floatIn(-80, 60, 6)}
      initial="hidden"
      animate="show"
      whileHover={{ y: -6, rotate: 2 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="absolute left-20 top-48 z-20 hidden sm:block md:left-32 md:top-56"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-card shadow-[0_18px_40px_-12px_rgba(0,0,0,0.18)] ring-1 ring-border">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary">
          <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
        </div>
      </div>
    </motion.div>
  );
}

function DiceIcon() {
  return (
    <div className="absolute left-1/2 top-12 z-10 -translate-x-1/2 md:top-[0px]">
      <svg viewBox="0 0 32 32" className="h-24 w-24 md:h-48 md:w-48">
        <defs>
          <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#405a8d" />
            <stop offset="100%" stopColor="#dcdde6" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#heroGrad)" opacity="0.2" />
        <path d="M16 8v16M8 16h16" stroke="url(#heroGrad)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function RemindersCard() {
  return (
    <motion.div
      variants={floatIn(80, -30, 6)}
      initial="hidden"
      animate="show"
      whileHover={{ y: -4, rotate: 3 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="absolute right-2 top-8 z-10 hidden rotate-[6deg] sm:block md:right-10"
    >
      <div className="w-60 rounded-2xl bg-card p-4 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.22)] ring-1 ring-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Study Reminder</span>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
          <Timer className="h-5 w-5 text-foreground" />
          <div className="flex-1">
            <div className="text-xs font-semibold">Pharmacology Review</div>
            <div className="text-[10px] text-muted-foreground">Cardiovascular drugs</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground">Time</div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          20:00 - 21:30
        </div>
      </div>
    </motion.div>
  );
}

function TasksCard() {
  const tasks = [
    { name: "Review Cardiology", date: "Today", pct: 60, color: "bg-primary" },
    { name: "MCQ Practice #4", date: "Today", pct: 112, color: "bg-orange-400" },
  ];
  return (
    <motion.div
      variants={floatIn(-100, 80, -4)}
      initial="hidden"
      animate="show"
      whileHover={{ y: -6, rotate: -1 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="absolute -bottom-6 left-0 z-20 hidden rotate-[-4deg] sm:block md:left-6"
    >
      <div className="w-72 rounded-2xl bg-card p-4 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.22)] ring-1 ring-border">
        <div className="text-sm font-semibold">Today&apos;s study plan</div>
        <div className="mt-3 space-y-2">
          {tasks.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: EASE }}
              className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5"
            >
              <span className={`h-7 w-1.5 rounded-full ${t.color}`} />
              <div className="flex-1">
                <div className="text-xs font-semibold">{t.name}</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(t.pct, 100)}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.7, ease: EASE }}
                      className={`h-full ${t.color}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{t.pct}%</span>
                </div>
                <div className="mt-0.5 text-[9px] text-muted-foreground">{t.date}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function IntegrationsCard() {
  return (
    <motion.div
      variants={floatIn(100, 80, 4)}
      initial="hidden"
      animate="show"
      whileHover={{ y: -6, rotate: 1 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="absolute -bottom-6 right-0 z-20 hidden rotate-[4deg] sm:block md:right-6"
    >
      <div className="w-72 rounded-2xl bg-card p-4 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.22)] ring-1 ring-border">
        <div className="text-sm font-semibold">AI Tutor Available</div>
        <div className="mt-3 flex items-center gap-3">
          {[Brain, BookOpen, Calendar].map((Icon, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: EASE }}
              whileHover={{ y: -4, scale: 1.05 }}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-background text-primary text-xl font-bold shadow-md ring-1 ring-border"
            >
              <Icon className="h-6 w-6" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-10 md:pt-16">
      <StickyNote />
      <CheckCard />
      <RemindersCard />
      <TasksCard />
      <IntegrationsCard />
      <DiceIcon />

      <div className="relative z-10 mx-auto max-w-3xl pt-28 text-center md:pt-36">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {HERO.badge}
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]"
        >
          {HERO.title}{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {HERO.titleAccent}
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mx-auto mt-6 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed"
        >
          {HERO.subtitle}
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="group h-14 px-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            {HERO.cta} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/auth"
            className="h-14 px-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-border text-muted-foreground font-medium text-base hover:bg-secondary transition-all"
          >
            <Play className="w-5 h-5" /> {HERO.secondaryCta}
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={5}
          className="mt-8 flex items-center justify-center gap-4"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-xs font-bold text-primary-foreground">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
            </div>
            <p className="text-xs text-muted-foreground">Loved by 10K+ students</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
