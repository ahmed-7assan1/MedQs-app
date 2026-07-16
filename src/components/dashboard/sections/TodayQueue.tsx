"use client";

import { motion } from "framer-motion";
import { BookOpen, Zap, Layers, AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { TodayTask } from "@/types/dashboard";

interface TodayQueueProps {
  tasks: TodayTask[];
}

export function TodayQueue({ tasks }: TodayQueueProps) {
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const pctCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getTaskIcon = (kind: TodayTask["kind"]) => {
    switch (kind) {
      case "lecture":
        return <BookOpen className="h-4.5 w-4.5 text-primary" />;
      case "quiz":
        return <Zap className="h-4.5 w-4.5 text-sky-500" />;
      case "flashcards":
        return <Layers className="h-4.5 w-4.5 text-amber-500" />;
      default:
        return <AlertCircle className="h-4.5 w-4.5 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: TodayTask["priority"]) => {
    switch (priority) {
      case "primary":
        return "bg-primary/10 text-primary border-primary/20";
      case "recommended":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-border/40";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Mini Progress */}
      <div className="flex items-center justify-between border-b border-border/20 pb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Today's Queue</h3>
          <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
            Personalized task queue for today's learning goals
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-black text-foreground tabular-nums">
            {completedCount} / {totalCount} <span className="text-[10px] font-medium text-muted-foreground">done</span>
          </span>
          <div className="h-1.5 w-20 bg-muted/40 rounded-full overflow-hidden mt-1 relative">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${pctCompleted}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="text-center py-8 bg-card/20 rounded-xl border border-dashed border-border/40">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs font-bold text-muted-foreground">All caught up! No tasks left for today.</p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className={`today-queue-item priority-${task.priority} relative`}
            >
              {/* Task Details */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-card shrink-0 shadow-sm border border-border/30">
                  {getTaskIcon(task.kind)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border leading-none ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.subtitle && (
                    <span className="text-[10px] text-muted-foreground mt-0.5 block truncate leading-none">
                      {task.subtitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Estimate Duration & Action */}
              <div className="flex items-center gap-4 shrink-0">
                {task.estimateMin && (
                  <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                    <Clock className="h-3 w-3" /> {task.estimateMin}m
                  </span>
                )}
                
                {task.status === "done" ? (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/10 shrink-0">
                    <CheckCircle2 className="h-4.5 w-4.5 text-sky-500" />
                  </div>
                ) : (
                  <Button asChild size="sm" variant="ghost" className="h-8 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/10">
                    <Link href={task.href}>
                      Start <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
