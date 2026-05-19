"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ArrowUpDown, Brain, Heart, Dna, FlaskConical, 
  Layers, Atom, BookOpen, Flame, Award, Sparkles, 
  ChevronRight, Library, BookOpenCheck, Target, GraduationCap 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define structured interface for modules
export interface ModuleWithStats {
  id: string;
  name: string;
  subjectsCount: number;
  lecturesCount: number;
  questionsCount: number;
  masteredCount: number;
  percentage: number;
  difficulty: { label: string; tone: string; bg: string } | null;
  subjectNames: string[];
}

interface ModulesGridProps {
  modules: ModuleWithStats[];
  totalMastered: number;
  isGuest: boolean;
}

// Assign unique styling identities per module
function getModuleStyle(name: string): { 
  theme: string; 
  icon: any; 
  glow: string; 
  bar: string; 
  badge: string;
} {
  const n = name.toUpperCase();
  if (n.includes("CNS") || n.includes("NEURO")) {
    return { 
      theme: "border-t-violet-500 hover:border-violet-400/50", 
      icon: Brain, 
      glow: "shadow-violet-500/10 dark:shadow-violet-500/20 group-hover:shadow-violet-500/30", 
      bar: "bg-gradient-to-r from-violet-500 to-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]", 
      badge: "bg-violet-500/10 text-violet-400 border-violet-500/20" 
    };
  }
  if (n.includes("ECE") || n.includes("CARDIO") || n.includes("ENDO") || n.includes("RESP")) {
    return { 
      theme: "border-t-rose-500 hover:border-rose-400/50", 
      icon: Heart, 
      glow: "shadow-rose-500/10 dark:shadow-rose-500/20 group-hover:shadow-rose-500/30", 
      bar: "bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]", 
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20" 
    };
  }
  if (n.includes("GENETIC") || n.includes("CELL") || n.includes("GENE") || n.includes("MICRO")) {
    return { 
      theme: "border-t-blue-500 hover:border-blue-400/50", 
      icon: Dna, 
      glow: "shadow-blue-500/10 dark:shadow-blue-500/20 group-hover:shadow-blue-500/30", 
      bar: "bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]", 
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" 
    };
  }
  if (n.includes("BIOCHEM") || n.includes("PHARMA") || n.includes("RENAL")) {
    return { 
      theme: "border-t-amber-500 hover:border-amber-400/50", 
      icon: FlaskConical, 
      glow: "shadow-amber-500/10 dark:shadow-amber-500/20 group-hover:shadow-amber-500/30", 
      bar: "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]", 
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" 
    };
  }
  if (n.includes("GIT") || n.includes("GI") || n.includes("NUTRI")) {
    return { 
      theme: "border-t-emerald-500 hover:border-emerald-400/50", 
      icon: Layers, 
      glow: "shadow-emerald-500/10 dark:shadow-emerald-500/20 group-hover:shadow-emerald-500/30", 
      bar: "bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]", 
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
    };
  }
  // Default
  return { 
    theme: "border-t-primary hover:border-primary/50", 
    icon: Atom, 
    glow: "shadow-primary/10 dark:shadow-primary/20 group-hover:shadow-primary/30", 
    bar: "bg-gradient-to-r from-primary to-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.5)]", 
    badge: "bg-primary/10 text-primary-400 border-primary/20" 
  };
}

export default function ModulesGrid({ modules, totalMastered, isGuest }: ModulesGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "mastery" | "lectures">("name");

  // Category tags mapping keywords to a display label
  const categories = [
    { id: "ALL", label: "All Modules" },
    { id: "CNS", label: "Nervous System (CNS)" },
    { id: "CARDIO", label: "Cardiopulmonary" },
    { id: "CELL", label: "Genetics & Micro" },
    { id: "PHARMA", label: "Biochem & Pharma" },
    { id: "GI", label: "Gastrointestinal (GI)" },
  ];

  // Helper to check if a module belongs to a specific category
  const matchesCategory = (moduleName: string, catId: string) => {
    if (catId === "ALL") return true;
    const name = moduleName.toUpperCase();
    if (catId === "CNS") return name.includes("CNS") || name.includes("NEURO");
    if (catId === "CARDIO") return name.includes("CARDIO") || name.includes("ECE") || name.includes("RESP") || name.includes("ENDO");
    if (catId === "CELL") return name.includes("GENETIC") || name.includes("CELL") || name.includes("GENE") || name.includes("MICRO");
    if (catId === "PHARMA") return name.includes("BIOCHEM") || name.includes("PHARMA") || name.includes("RENAL");
    if (catId === "GI") return name.includes("GIT") || name.includes("GI");
    return false;
  };

  // Filter and sort modules
  const filteredAndSortedModules = useMemo(() => {
    let result = modules.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        matchesCategory(m.name, selectedCategory)
    );

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "mastery") {
      result.sort((a, b) => b.percentage - a.percentage);
    } else if (sortBy === "lectures") {
      result.sort((a, b) => b.lecturesCount - a.lecturesCount);
    }

    return result;
  }, [modules, searchQuery, selectedCategory, sortBy]);

  // Compute stats metrics
  const avgMastery = useMemo(() => {
    if (modules.length === 0) return 0;
    const sum = modules.reduce((acc, m) => acc + m.percentage, 0);
    return Math.round(sum / modules.length);
  }, [modules]);

  const totalLectures = useMemo(() => {
    return modules.reduce((acc, m) => acc + m.lecturesCount, 0);
  }, [modules]);

  const levelInfo = useMemo(() => {
    const pointsPerLevel = 150;
    const level = Math.floor(totalMastered / pointsPerLevel) + 1;
    const currentProgress = totalMastered % pointsPerLevel;
    const pct = Math.round((currentProgress / pointsPerLevel) * 100);
    return { level, currentProgress, totalNeeded: pointsPerLevel, pct };
  }, [totalMastered]);

  return (
    <div className="space-y-12">
      {/* ── METRICS DASHBOARD PANEL ── */}
      {!isGuest && modules.length > 0 && (
        <div className="flex md:grid gap-4 overflow-x-auto no-scrollbar pb-2 md:grid-cols-3 -mx-6 px-6 md:mx-0 md:px-0">
          {/* Dashboard Widget 1: Mastery Circle */}
          <div className="relative overflow-hidden rounded-[24px] md:rounded-[32px] border border-white/[0.04] bg-[#0d0e1b]/70 p-5 md:p-6 shadow-2xl backdrop-blur-xl flex items-center gap-5 md:gap-6 w-[280px] shrink-0 md:w-auto">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative shrink-0 flex items-center justify-center h-16 w-16 md:h-20 md:w-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-white/[0.04] fill-none"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-primary fill-none transition-all duration-1000"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - avgMastery / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base md:text-lg font-black text-white">{avgMastery}%</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary-400/80 flex items-center gap-1.5">
                <Target className="h-3 w-3" /> Mastery Score
              </span>
              <h3 className="text-lg md:text-xl font-black text-white">Curriculum Health</h3>
              <p className="text-[10px] md:text-xs text-white/40 font-semibold">Average mastery across all modules.</p>
            </div>
          </div>

          {/* Dashboard Widget 2: Level Progression */}
          <div className="relative overflow-hidden rounded-[24px] md:rounded-[32px] border border-white/[0.04] bg-[#0d0e1b]/70 p-5 md:p-6 shadow-2xl backdrop-blur-xl w-[280px] shrink-0 md:w-auto">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Rank Progress
              </span>
              <span className="text-[10px] md:text-[11px] font-black text-white bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-500/30">
                Level {levelInfo.level}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <h3 className="text-base md:text-lg font-black text-white leading-none">Mastery Level</h3>
                <span className="text-[10px] md:text-xs text-white/50 font-bold">{levelInfo.currentProgress} / {levelInfo.totalNeeded} XP</span>
              </div>
              <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-1000" 
                  style={{ width: `${levelInfo.pct}%` }}
                />
              </div>
              <p className="text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-wider">
                {levelInfo.totalNeeded - levelInfo.currentProgress} Qs to Level {levelInfo.level + 1}
              </p>
            </div>
          </div>

          {/* Dashboard Widget 3: Active Streak */}
          <div className="relative overflow-hidden rounded-[24px] md:rounded-[32px] border border-white/[0.04] bg-[#0d0e1b]/70 p-5 md:p-6 shadow-2xl backdrop-blur-xl flex items-center gap-5 md:gap-6 w-[280px] shrink-0 md:w-auto">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/5">
              <Flame className="h-6 w-6 md:h-8 md:w-8 text-amber-500 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Study Streak
              </span>
              <h3 className="text-lg md:text-xl font-black text-white">5 Days Active</h3>
              <p className="text-[10px] md:text-xs text-white/40 font-semibold">Keep it up, future doctor!</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between p-4 rounded-[28px] border border-white/[0.03] bg-white/[0.01] backdrop-blur-md">
        
        {/* Category Tabs (Horizontal Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shrink-0 transition-all duration-300 border",
                selectedCategory === cat.id
                  ? "bg-primary border-primary/20 text-white shadow-lg shadow-primary/20 scale-[1.03]"
                  : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Panel */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs font-semibold text-white bg-white/[0.02] border border-white/5 placeholder-white/20 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setSortBy((prev) => 
                  prev === "name" ? "mastery" : prev === "mastery" ? "lectures" : "name"
                );
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-white/60 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:text-white transition-all shrink-0"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Sort: {sortBy === "name" ? "AZ" : sortBy === "mastery" ? "Mastery" : "Lectures"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD GRID WITH MOTION ── */}
      {filteredAndSortedModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] py-24 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/5 text-white/20">
            <Library className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-widest">No Modules Found</h3>
          <p className="mt-2 text-white/40 text-xs font-semibold max-w-xs mx-auto">
            Try adjusting your search criteria or category filter.
          </p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSortedModules.map((mod, index) => {
              const modStyle = getModuleStyle(mod.name);
              const CardIcon = modStyle.icon;

              return (
                <motion.div
                  key={mod.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                  className="group"
                >
                  <Link href={isGuest ? "/login" : `/modules/${mod.id}`}>
                    <div className={cn(
                      "relative flex flex-col bg-card/45 dark:bg-[#0c0d18]/45 border border-white/[0.03] rounded-[24px] md:rounded-[32px] p-5 md:p-6 transition-all duration-300 cursor-pointer shadow-xl hover:-translate-y-1 hover:bg-white/[0.01] border-t-2",
                      modStyle.theme,
                      modStyle.glow
                    )}>
                      
                      {/* Glow Highlight background */}
                      <div className="absolute inset-0 rounded-[24px] md:rounded-[32px] bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />

                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-6">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden transition-transform duration-500 group-hover:scale-115",
                          "bg-white/[0.02]"
                        )}>
                          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                          <CardIcon className="h-6 w-6 text-primary group-hover:animate-pulse" />
                        </div>

                        {/* Difficulty or status Badge */}
                        {mod.difficulty && (
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            mod.difficulty.bg,
                            mod.difficulty.tone,
                            "border-white/[0.02]"
                          )}>
                            {mod.difficulty.label}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-4 flex-1">
                        <div className="space-y-1">
                          <h3 className="text-[17px] font-black text-white group-hover:text-primary transition-colors duration-200 line-clamp-1 leading-tight">
                            {mod.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                            <span className="text-primary-400">{mod.subjectsCount} Subjects</span>
                            <span>•</span>
                            <span>{mod.lecturesCount} Lectures</span>
                          </div>
                        </div>

                        {/* Mini subject badges */}
                        {mod.subjectNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 py-1 max-h-[58px] overflow-hidden">
                            {mod.subjectNames.slice(0, 3).map((subName) => (
                              <span key={subName} className="px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-[9px] font-bold text-white/40 truncate max-w-[100px]">
                                {subName}
                              </span>
                            ))}
                            {mod.subjectNames.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-[9px] font-black text-white/20">
                                +{mod.subjectNames.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Progress Bar widget */}
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                            <span className="text-white/30">Mastery Progress</span>
                            <span className="text-primary">{mod.percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden relative">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-1000", modStyle.bar)} 
                              style={{ width: `${mod.percentage}%` }}
                            />
                            {/* Shiny progress reflection */}
                            {mod.percentage > 0 && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/2 animate-shimmer" style={{ animationDuration: "2s" }} />
                            )}
                          </div>
                        </div>

                        {/* Hover reveal play button */}
                        <div className="pt-2 flex items-center justify-between text-xs font-black text-white/40 group-hover:text-primary transition-colors duration-200 uppercase tracking-widest">
                          <span>Enter module</span>
                          <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
