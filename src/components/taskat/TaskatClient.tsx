"use client";

import { useState, useEffect, useMemo } from "react";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { 
  CheckCircle2, 
  Circle, 
  ClipboardList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CurriculumChecklist } from "./CurriculumChecklist";
import { DailyFocus } from "./DailyFocus";
import { motion, AnimatePresence } from "framer-motion";

interface TaskatClientProps {
  userId: string;
  initialCurriculum: any[];
  initialSubjects: any[];
}

export function TaskatClient({ userId, initialCurriculum, initialSubjects }: TaskatClientProps) {
  const [activeTab, setActiveTab] = useState<"checklist" | "daily">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayProgress, setDayProgress] = useState(0);

  const handleProgressUpdate = (pct: number) => {
    setDayProgress(pct);
  };

  return (
    <StudentPageShell maxWidthClass="max-w-6xl">
      {/* Premium Header */}
      <div className="relative mb-6 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 p-6 md:p-10 shadow-2xl backdrop-blur-3xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row md:gap-10">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
                <Target className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600/60 dark:text-sky-400/60">Productivity Hub</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl dark:text-white text-slate-900 leading-tight">
              Taskat <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">تاسكات</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm md:text-base font-medium leading-relaxed dark:text-slate-400 text-slate-600">
              Your personal mastery lab. Plan, track, and dominate your degree.
            </p>
          </div>

          <div className="flex items-center gap-6 md:gap-8 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
            <div className="relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center">
              <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="16"
                  fill="none"
                  className="stroke-slate-200 dark:stroke-white/5"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="18" cy="18" r="16"
                  fill="none"
                  stroke="currentColor"
                  className="text-sky-500"
                  strokeWidth="3"
                  strokeDasharray="100"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - dayProgress }}
                  strokeLinecap="round"
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-bold font-display dark:text-white text-slate-900">{Math.round(dayProgress)}%</span>
                <span className="text-[9px] uppercase tracking-widest dark:text-white/40 text-slate-500 font-bold">Today</span>
              </div>
            </div>
            <div className="h-12 md:h-16 w-px bg-slate-200 dark:bg-white/10" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[9px] font-black uppercase tracking-wider dark:text-white/30 text-slate-400">Mission</p>
              <p className="text-base md:text-lg font-display font-bold text-sky-600 dark:text-sky-400">
                {dayProgress === 100 ? "Victory!" : dayProgress > 0 ? "Active" : "Ready"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="mb-10 space-y-8">
        <div className="flex justify-center">
          <div className="flex gap-1.5 rounded-2xl bg-white/50 dark:bg-white/5 p-1.5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-lg">
            <button
              onClick={() => setActiveTab("daily")}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-8 py-3 text-sm font-bold transition-all duration-300",
                activeTab === "daily" 
                  ? "bg-sky-500 text-white shadow-xl shadow-sky-500/30 scale-105" 
                  : "dark:text-white/60 text-slate-500 hover:text-sky-600 dark:hover:text-white hover:bg-white/10"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              Daily Focus
            </button>
            <button
              onClick={() => setActiveTab("checklist")}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-8 py-3 text-sm font-bold transition-all duration-300",
                activeTab === "checklist" 
                  ? "bg-sky-500 text-white shadow-xl shadow-sky-500/30 scale-105" 
                  : "dark:text-white/60 text-slate-500 hover:text-sky-600 dark:hover:text-white hover:bg-white/10"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Academic Tracker
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "daily" ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <DailyFocus 
                userId={userId}
                selectedDate={selectedDate} 
                onDateChange={setSelectedDate}
                onProgressUpdate={handleProgressUpdate} 
                initialCurriculum={initialCurriculum} 
                initialSubjects={initialSubjects} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <CurriculumChecklist modules={initialCurriculum} subjects={initialSubjects} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudentPageShell>
  );
}
