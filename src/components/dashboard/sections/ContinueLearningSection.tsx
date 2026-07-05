"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, GraduationCap, BookOpen, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import type { DashboardData } from "@/types/dashboard";

const progressGradients = [
  "from-primary/20 via-primary/5 to-transparent",
  "from-emerald-500/20 via-emerald-500/5 to-transparent",
  "from-violet-500/20 via-violet-500/5 to-transparent",
  "from-amber-500/20 via-amber-500/5 to-transparent",
];

export function ContinueLearningSection({ data }: { data: DashboardData }) {
  const modules = data.moduleProgress?.slice(0, 4) || [];

  if (modules.length === 0) {
    return (
      <div>
        <SectionHeader icon={BookOpen} title="Continue Learning" />
        <Button variant="outline" asChild className="w-full p-0 h-auto rounded-2xl border-dashed bg-card/30 hover:bg-card/50">
          <Link
            href="/modules"
            className="flex items-center justify-between p-5"
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
        </Button>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader icon={BookOpen} title="Continue Learning" />

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-webkit-scrollbar]:hidden">
        {modules.map((mod, i) => {
          const gradient = progressGradients[i % progressGradients.length];
          const timeLeft = Math.round((100 - mod.pct) / 10) * 5 || 5;

          return (
            <motion.div
              key={mod.id}
              className="snap-start shrink-0"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card asChild className="group w-[220px] md:w-[280px] lg:w-[240px] overflow-hidden rounded-2xl border-border/40 bg-card/80 shadow-sm will-change-transform transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <Link href={`/modules/${mod.id}`}>
                  <CardContent className="p-5 relative">
                    {/* Gradient overlay based on progress */}
                    <div className={cn("absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />

                    {/* Subtle top accent line */}
                    <div className="absolute top-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-primary/40 to-accent/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5",
                          mod.pct >= 80 ? "bg-emerald-500/15 text-emerald-500" :
                          mod.pct >= 40 ? "bg-primary/15 text-primary" :
                          "bg-muted/30 text-muted-foreground"
                        )}>
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate">Module</p>
                          <p className="text-xs font-bold text-foreground truncate">{mod.name}</p>
                        </div>
                      </div>

                      {/* Progress section */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                          <span className="text-foreground/80">{mod.pct}%</span>
                          <span className="text-muted-foreground/50 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeLeft} min
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${mod.pct}%` }}
                            transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider transition-all duration-300 group-hover:translate-x-1">
                        <Play className="h-3 w-3" />
                        Continue
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
