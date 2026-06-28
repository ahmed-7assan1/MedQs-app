"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Play, GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, EASE } from "@/components/dashboard/shared/animations";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import type { DashboardData } from "@/types/dashboard";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, delay: i * 0.08 },
  }),
};

export function ContinueLearningSection({ data }: { data: DashboardData }) {
  const modules = data.moduleProgress?.slice(0, 4) || [];

  if (modules.length === 0) {
    return (
      <motion.div variants={fadeUp}>
        <SectionHeader icon={BookOpen} title="Continue Learning" />
        <Link
          href="/modules"
          className="flex items-center justify-between p-5 rounded-2xl border border-dashed border-border bg-card/30 hover:bg-card/50 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-bold text-foreground">No active modules</p>
              <p className="text-xs text-muted-foreground">Enroll to get started</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors duration-300" />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp}>
      <SectionHeader icon={BookOpen} title="Continue Learning" />

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-webkit-scrollbar]:hidden">
        {modules.map((mod, i) => (
          <motion.div
            key={mod.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="snap-start shrink-0"
          >
            <Link
              href={`/modules/${mod.id}`}
              className="group relative block w-[220px] md:w-[280px] lg:w-[240px] overflow-hidden rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate">Module</p>
                    <p className="text-xs font-bold text-foreground truncate">{mod.name}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-foreground">{mod.pct}%</span>
                    <span className="text-muted-foreground/50">
                      {Math.round((100 - mod.pct) / 10) * 5 || 5} min
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${mod.pct}%` }}
                      transition={{ duration: 1, ease: EASE, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider transition-all duration-300 group-hover:translate-x-1">
                  <Play className="h-3 w-3" />
                  Continue
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
