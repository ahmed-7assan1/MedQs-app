"use client";

import { motion, type Variants } from "framer-motion";
import { ChevronRight, Sparkles, Play, Star } from "lucide-react";
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



export function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-10 md:pt-16">
      <TasksCard />

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
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md dark:bg-white dark:text-black"
          >
            {HERO.cta} <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
          >
            <Play className="h-4 w-4" /> {HERO.secondaryCta}
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
