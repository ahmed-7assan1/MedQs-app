"use client";

import { useState, useEffect } from "react";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { 
  ClipboardList,
  LayoutGrid,
  Target,
  ChevronRight
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
  const [dayProgress, setDayProgress] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleProgressUpdate = (pct: number) => {
    setDayProgress(pct);
  };

  return (
    <StudentPageShell maxWidthClass="max-w-5xl" className="pt-0 lg:pt-10" noTopPaddingMobile>
      {/* 1. Simplified Compact Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 px-2 lg:px-0">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <Target className="h-4 w-4 text-primary opacity-60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Productivity Lab</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Taskat <span className="text-primary italic">تاسكات</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground/70 max-w-sm">
            Track your daily focus and academic progress.
          </p>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className="flex items-center gap-6 p-4 rounded-3xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
          <div className="relative h-16 w-16 flex items-center justify-center">
            <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
              <motion.circle
                cx="18" cy="18" r="16" fill="none" stroke="currentColor"
                className="text-primary" strokeWidth="3" strokeDasharray="100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - dayProgress }}
                strokeLinecap="round" transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <span className="text-base font-black text-foreground">{Math.round(dayProgress)}%</span>
          </div>
          <div className="space-y-0.5 pr-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Today's Progress</p>
            <p className="text-lg font-black text-primary">
              {dayProgress === 100 ? "Victory!" : dayProgress > 50 ? "Almost there" : "Keep going"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sleek Tab Switcher */}
      <div className="mb-10 flex flex-col space-y-8">
        <div className="flex justify-center">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-muted/40 border border-border/50 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("daily")}
              className={cn(
                "relative flex items-center gap-2.5 px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                activeTab === "daily" 
                  ? "bg-card text-foreground shadow-md border border-border/10" 
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              Daily Focus
              {activeTab === "daily" && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary/5 rounded-xl -z-10" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("checklist")}
              className={cn(
                "relative flex items-center gap-2.5 px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                activeTab === "checklist" 
                  ? "bg-card text-foreground shadow-md border border-border/10" 
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Tracker
              {activeTab === "checklist" && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary/5 rounded-xl -z-10" />
              )}
            </button>
          </div>
        </div>

        {/* 3. Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "daily" ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <CurriculumChecklist modules={initialCurriculum} subjects={initialSubjects} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudentPageShell>
  );
}
