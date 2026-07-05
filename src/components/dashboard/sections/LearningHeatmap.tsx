"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import { last7DayKeys } from "@/lib/dashboard-stats";
import type { DashboardData } from "@/types/dashboard";
import { BarChart3 } from "lucide-react";

function getLevel(count: number, max: number): number {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const levelColors = [
  "bg-gradient-to-t from-muted/20 to-muted/10",
  "bg-gradient-to-t from-primary/20 to-primary/10",
  "bg-gradient-to-t from-primary/40 to-primary/25",
  "bg-gradient-to-t from-primary/60 to-primary/40",
  "bg-gradient-to-t from-primary/90 to-primary/60",
];

export function LearningHeatmap({ data }: { data: DashboardData }) {
  const chartDays = last7DayKeys();
  const activityArr = data.activityArr || [];
  const maxCount = Math.max(...(activityArr.map((a) => a.count) || []), 1);
  const totalUnits = activityArr.reduce((a: number, b: any) => a + b.count, 0);
  const avgPerDay = chartDays.length > 0 ? (totalUnits / chartDays.length).toFixed(1) : "0";

  return (
    <div>
      <SectionHeader
        icon={BarChart3}
        title="Weekly Activity"
        right={
          <span className="text-[10px] font-bold text-muted-foreground/50">
            {totalUnits} units · avg {avgPerDay}/day
          </span>
        }
      />

      <Card className="bg-card/70 border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-end gap-2.5 min-h-[120px]">
            {chartDays.map((d, i) => {
              const dayData = activityArr?.find((x: any) => x.day === d.key);
              const val = dayData?.count || 0;
              const level = getLevel(val, maxCount);
              const isToday = i === chartDays.length - 1;
              const barHeight = maxCount > 0 ? Math.max(20, (val / maxCount) * 80) : 20;

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 group"
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-[9px] font-bold bg-foreground/10 text-foreground/70 px-1.5 py-0.5 rounded">
                      {val}
                    </span>
                  </div>

                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barHeight }}
                    transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "w-full rounded-md transition-all duration-300 group-hover:scale-y-105 group-hover:shadow-lg origin-bottom relative",
                      levelColors[level],
                      isToday && "ring-1 ring-primary/30"
                    )}
                  />

                  {/* Day label */}
                  <span className={cn(
                    "text-[9px] font-black uppercase mt-auto",
                    isToday ? "text-primary" : "text-muted-foreground/50"
                  )}>
                    {d.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
