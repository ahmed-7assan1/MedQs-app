"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Play,
  Brain,
  Target,
  Sparkle,
  BookOpen,
  ArrowRight,
  Activity,
  Trophy,
  Flame,
  PlayCircle,
  Wrench,
  Microscope,
  Stethoscope,
  List,
  CaretRight,
  Gear,
  Bell,
} from "@phosphor-icons/react";
import {
  MobileContinueCard,
  MobileSpecCard,
  MobileDrQCard,
  MobileBentoStatCard,
  MobileBentoQuickCard,
  MobileListedStats,
} from "./MobileDashboardComponents";

interface MobileDashboardClientProps {
  firstName: string;
  greeting: string;
  currentStreak: number;
  rankPoints: number;
  rankLabel: string;
  dailyPct: number;
  overallPct: number;
  todayItemCount: number;
  dailyTarget: number;
  totalQuestions: number;
  lastLectureActivity: any;
  moduleProgress: any[];
  alert?: React.ReactNode;
}

export function MobileDashboardClient({
  firstName,
  greeting,
  currentStreak,
  rankPoints,
  rankLabel,
  dailyPct,
  overallPct,
  todayItemCount,
  dailyTarget,
  totalQuestions,
  lastLectureActivity,
  moduleProgress,
  alert,
}: MobileDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"syllabus" | "analytics" | "tools">("syllabus");

  const statsData = [
    {
      label: "Daily Target",
      value: `${todayItemCount} / ${dailyTarget} solved`,
      iconName: "Target",
      progress: dailyPct,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      label: "Knowledge Mastery",
      value: `${overallPct}% completed`,
      iconName: "Brain",
      progress: overallPct,
      color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    },
    {
      label: "Active Modules",
      value: `${moduleProgress.length} active`,
      iconName: "BookOpen",
      progress: Math.min(100, moduleProgress.length * 20),
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6 md:hidden pb-12">
      {/* Greeting & Top Utilities Header */}
      <section className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.15em]">
            {greeting},
          </p>
          <h1 className="text-[26px] font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 font-black">
              Dr. {firstName}
            </span>{' '}
            <span className="animate-bounce">dY`</span>
          </h1>
        </div>
        {/* Top Right Icons */}
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="h-9 w-9 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-primary active:scale-90 transition-all"
          >
            <Bell size={18} weight="bold" />
          </Link>
          <Link
            href="/settings"
            className="h-9 w-9 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-primary active:scale-90 transition-all"
          >
            <Gear size={18} weight="bold" />
          </Link>
        </div>
      </section>

      {/* Segmented Switcher Pill Tabs */}
      <div className="p-1 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.04] flex items-center relative z-20">
        {(["syllabus", "analytics", "tools"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 relative py-2.5 text-[11px] font-black uppercase tracking-wider text-center transition-all"
          >
            {activeTab === tab && (
              <motion.div
                layoutId="active-dashboard-tab"
                className="absolute inset-0 rounded-full bg-white dark:bg-white/10 border border-slate-200/50 dark:border-white/5 shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span
              className={
                activeTab === tab
                  ? "text-slate-800 dark:text-white z-10 relative font-extrabold"
                  : "text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60 z-10 relative"
              }
            >
              {tab}
            </span>
          </button>
        ))}
      </div>

      {/* Highlight Cards (Streak & XP) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Streak Card */}
        <Link href="/taskat" className="block">
          <div className="p-5 rounded-[28px] border border-blue-100 dark:border-indigo-500/10 bg-[#EFF6FF] dark:bg-indigo-950/20 shadow-sm dark:shadow-none relative flex flex-col justify-between h-[130px] active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between w-full">
              <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-indigo-500/20 flex items-center justify-center text-blue-600 dark:text-indigo-400">
                <Flame size={20} weight="fill" />
              </div>
              <CaretRight size={14} weight="bold" className="text-blue-500 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[22px] font-black text-blue-900 dark:text-indigo-200 leading-none">{currentStreak} Days</p>
              <p className="text-[9px] font-bold text-blue-700/60 dark:text-indigo-400/50 uppercase tracking-wider mt-1.5">
                Streak Progress
              </p>
            </div>
          </div>
        </Link>
        {/* XP Card */}
        <Link href="/profile" className="block">
          <div className="p-5 rounded-[28px] border border-emerald-100 dark:border-emerald-500/10 bg-[#F0FDF4] dark:bg-emerald-950/20 shadow-sm dark:shadow-none relative flex flex-col justify-between h-[130px] active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between w-full">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Trophy size={20} weight="fill" />
              </div>
              <CaretRight size={14} weight="bold" className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[22px] font-black text-emerald-900 dark:text-emerald-200 leading-none">{rankPoints.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-emerald-700/60 dark:text-emerald-400/50 uppercase tracking-wider mt-1.5">
                Academic XP
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === "syllabus" && (
            <motion.div
              key="syllabus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Resume learning feed card */}
              <div>
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[9px] font-black text-slate-400 dark:text-white/25 uppercase tracking-widest">
                    Recent Activity
                  </p>
                </div>
                {lastLectureActivity?.lecture?.subject ? (
                  <MobileContinueCard
                    module={lastLectureActivity.lecture.title}
                    subject={lastLectureActivity.lecture.subject.name}
                    progress={overallPct}
                    href={`/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}`}
                  />
                ) : (
                  <MobileContinueCard module="Start Studying" subject="Select an academic module" progress={0} href="/modules" />
                )}
              </div>

              {/* Ask Dr. Q search box */}
              <MobileDrQCard />

              {/* Active Disciplines list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[9px] font-black text-slate-400 dark:text-white/25 uppercase tracking-widest">
                    Active disciplines
                  </p>
                  <Link href="/modules" className="text-[10px] font-black text-primary hover:underline">
                    View All +
                  </Link>
                </div>
                <div className="space-y-0.5">
                  {moduleProgress.length > 0 ? (
                    moduleProgress.slice(0, 3).map((mod: any, i: number) => (
                      <MobileSpecCard
                        key={mod.id}
                        name={mod.name}
                        iconName={i === 0 ? "Brain" : i === 1 ? "Wrench" : i === 2 ? "Microscope" : "Activity"}
                        progress={mod.pct}
                        delay={0.05 * i}
                      />
                    ))
                  ) : (
                    <div className="p-6 rounded-[24px] border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.01] text-center shadow-sm dark:shadow-none">
                      <p className="text-xs text-slate-400 dark:text-white/40 font-bold uppercase tracking-wider">
                        No disciplines active
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Detailed Metrics Switchboard */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 dark:text-white/25 uppercase tracking-widest px-1">
                  Detailed Metrics
                </p>
                <MobileListedStats stats={statsData} />
              </div>
            </motion.div>
          )}

          {activeTab === "tools" && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Quick Actions Shortcuts Grid */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 dark:text-white/25 uppercase tracking-widest px-1">
                  Toolbox
                </p>
                <div className="grid grid-cols-2 gap-3.5">
                  <MobileBentoQuickCard
                    label="Video Hub"
                    iconName="PlayCircle"
                    colorClass="bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-400"
                    delay={0.05}
                    href="/videos"
                  />
                  <MobileBentoQuickCard
                    label="Mock Exams"
                    iconName="Flame"
                    colorClass="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
                    delay={0.1}
                    href="/past-papers"
                  />
                  <MobileBentoQuickCard
                    label="Study Tools"
                    iconName="Wrench"
                    colorClass="bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
                    delay={0.15}
                    href="/study-tools"
                  />
                  <MobileBentoQuickCard
                    label="Audio Lab"
                    iconName="Mic"
                    colorClass="bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400"
                    delay={0.2}
                    href="/podcasts"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
