"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, GraduationCap, BookOpen, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import type { DashboardData } from "@/types/dashboard";

const thumbnailGradients = [
  "from-primary/30 via-primary/10 to-transparent",
  "from-emerald-500/30 via-emerald-500/10 to-transparent",
  "from-violet-500/30 via-violet-500/10 to-transparent",
  "from-amber-500/30 via-amber-500/10 to-transparent",
];

const accentBorders = [
  "border-primary/30 group-hover:border-primary/50",
  "border-emerald-500/30 group-hover:border-emerald-500/50",
  "border-violet-500/30 group-hover:border-violet-500/50",
  "border-amber-500/30 group-hover:border-amber-500/50",
];

export function ContinueLearningSection({ data }: { data: DashboardData }) {
  const modules = data.moduleProgress?.slice(0, 4) || [];

  if (modules.length === 0) {
    return (
      <div>
        <SectionHeader icon={BookOpen} title="Continue Learning" />
        <Button variant="outline" asChild className="w-full p-0 h-auto rounded-2xl border-dashed bg-card/30 hover:bg-card/50">
          <Link href="/modules" className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-7 w-7 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-bold text-foreground">No active modules</p>
                <p className="text-xs text-muted-foreground">Enroll to get started</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center">
        <SectionHeader icon={BookOpen} title="Continue Learning" className="mb-0 justify-center [&>div:last-child]:hidden" />
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-5">
        {modules.map((mod, i) => {
          const thumbGrad = thumbnailGradients[i % thumbnailGradients.length];
          const accentBorder = accentBorders[i % accentBorders.length];
          const timeLeft = Math.round((100 - mod.pct) / 10) * 5 || 5;

          return (
            <motion.div
              key={mod.id}
              className="snap-start shrink-0"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card asChild className={cn(
                "group w-[220px] md:w-[280px] lg:w-[260px] overflow-hidden rounded-xl border-border/30 bg-card shadow-sm will-change-transform transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md",
                accentBorder
              )}>
                <Link href={`/modules/${mod.id}`}>
                  <CardContent className="p-0 relative">
                    {/* Thumbnail area */}
                    {mod.imageUrl ? (
                      <div className="relative h-24 md:h-28 overflow-hidden">
                        <img src={mod.imageUrl} alt={mod.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
                            <Play className="h-5 w-5 ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                    <div className={cn(
                      "relative flex items-center justify-center h-24 md:h-28 bg-gradient-to-br",
                      thumbGrad
                    )}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-background/40 border border-border/20 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
                        <GraduationCap className={cn(
                          "h-6 w-6 transition-colors duration-300",
                          mod.pct >= 80 ? "text-emerald-500" : mod.pct >= 40 ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      {/* Play button overlay on hover */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-t-2xl">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg shadow-primary/30">
                          <Play className="h-5 w-5 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Content area */}
                    <div className="p-4 relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Module</p>
                        <span className="text-muted-foreground/50 flex items-center gap-1 text-[9px]">
                          <Clock className="h-2.5 w-2.5" />
                          {timeLeft} min
                        </span>
                      </div>
                      <p className="text-xs font-bold text-foreground truncate mb-3">{mod.name}</p>

                      <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                        <span className="text-foreground/80">{mod.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${mod.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider transition-all duration-300 group-hover:translate-x-1 mt-3">
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
