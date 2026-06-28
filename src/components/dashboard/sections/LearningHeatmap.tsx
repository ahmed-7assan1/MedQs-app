"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp, EASE } from "@/components/dashboard/shared/animations";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import { last7DayKeys } from "@/lib/dashboard-stats";
import type { DashboardData } from "@/types/dashboard";

function getLevel(count: number, max: number): number {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const levelColors = [
  "bg-muted/20",
  "bg-primary/15",
  "bg-primary/30",
  "bg-primary/50",
  "bg-primary/80",
];

const cellVariants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: EASE, delay: i * 0.06 },
  }),
};

export function LearningHeatmap({ data }: { data: DashboardData }) {
  const chartDays = last7DayKeys();
  const activityArr = data.activityArr || [];
  const maxCount = Math.max(...(activityArr.map((a) => a.count) || []), 1);

  return (
    <motion.div variants={fadeUp}>
      <SectionHeader
        title="Study Activity"
        right={
          <span className="text-[10px] font-bold text-muted-foreground/50">
            {activityArr.reduce((a: number, b: any) => a + b.count, 0)} units this week
          </span>
        }
      />

      <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-2">
          {chartDays.map((d, i) => {
            const dayData = activityArr?.find((x: any) => x.day === d.key);
            const val = dayData?.count || 0;
            const level = getLevel(val, maxCount);
            const isToday = i === chartDays.length - 1;

            return (
              <motion.div
                key={i}
                custom={i}
                variants={cellVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "w-full aspect-square rounded-lg transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-primary/30",
                    levelColors[level],
                    isToday && "ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
                  )}
                  title={`${d.shortLabel}: ${val} units`}
                />
                <span className={cn("text-[9px] font-black uppercase", isToday ? "text-primary" : "text-muted-foreground/50")}>
                  {d.shortLabel}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
