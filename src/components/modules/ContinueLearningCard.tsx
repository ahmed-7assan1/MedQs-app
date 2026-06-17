"use client";

import Link from "next/link";
import { Play, ArrowRight, Clock } from "lucide-react";

interface ContinueLearningCardProps {
  lectureId: string;
  lectureTitle: string;
  subjectName: string;
  moduleId: string;
  moduleName: string;
  lastViewedAt: Date;
  source?: string | null;
}

export default function ContinueLearningCard({
  lectureId,
  lectureTitle,
  subjectName,
  moduleId,
  moduleName,
  lastViewedAt,
  source,
}: ContinueLearningCardProps) {
  const href = `/modules/${moduleId}/lectures/${lectureId}`;
  const timeAgo = getTimeAgo(lastViewedAt);

  return (
    <Link href={href} className="block group">
      <div className="relative rounded-2xl border border-border/40 dark:border-white/[0.07] bg-card/60 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/30 dark:hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-violet-500 rounded-r-full" />
        <div className="p-2.5 pl-4">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 dark:from-primary/30 dark:to-violet-500/30 flex items-center justify-center">
              <Play className="h-4 w-4 text-primary fill-primary/20 ml-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-white/30">
                  Continue Learning
                </p>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/40 shrink-0">
                  <Clock className="h-2.5 w-2.5" />
                  {timeAgo}
                </div>
              </div>
              <h3 className="font-black text-foreground text-xs leading-tight truncate mt-px">
                {lectureTitle}
              </h3>
              <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[9px] font-bold text-muted-foreground/50 truncate">
                    {subjectName} · {moduleName}
                  </p>
                  <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary shrink-0 ml-2 transition-all duration-300 group-hover:gap-1.5">
                    Continue <ArrowRight className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
