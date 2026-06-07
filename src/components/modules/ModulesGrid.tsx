"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ArrowUpDown, Brain, Heart, Dna, FlaskConical, 
  Layers, Atom, BookOpen, Flame, Award, Sparkles, 
  ChevronRight, Library, BookOpenCheck, Target, GraduationCap,
  ArrowUp, ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModuleWithStats {
  id: string;
  name: string;
  icon: string | null;
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
  currentStreak: number;
}

type IconKey = "Brain" | "Heart" | "Dna" | "FlaskConical" | "Layers" | "Atom" | "BookOpen";

const iconMap: Record<string, any> = { Brain, Heart, Dna, FlaskConical, Layers, Atom, BookOpen };

const iconThemeMap: Record<string, {
  theme: string; icon: any; glow: string; bar: string; badge: string;
}> = {
  Brain:          { theme: "border-t-violet-500 hover:border-violet-400/50", icon: Brain, glow: "shadow-violet-500/10 dark:shadow-violet-500/20 group-hover:shadow-violet-500/30", bar: "bg-gradient-to-r from-violet-500 to-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]", badge: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  Heart:          { theme: "border-t-rose-500 hover:border-rose-400/50", icon: Heart, glow: "shadow-rose-500/10 dark:shadow-rose-500/20 group-hover:shadow-rose-500/30", bar: "bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]", badge: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  Dna:            { theme: "border-t-blue-500 hover:border-blue-400/50", icon: Dna, glow: "shadow-blue-500/10 dark:shadow-blue-500/20 group-hover:shadow-blue-500/30", bar: "bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  FlaskConical:   { theme: "border-t-amber-500 hover:border-amber-400/50", icon: FlaskConical, glow: "shadow-amber-500/10 dark:shadow-amber-500/20 group-hover:shadow-amber-500/30", bar: "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  Layers:         { theme: "border-t-emerald-500 hover:border-emerald-400/50", icon: Layers, glow: "shadow-emerald-500/10 dark:shadow-emerald-500/20 group-hover:shadow-emerald-500/30", bar: "bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  Atom:           { theme: "border-t-primary hover:border-primary/50", icon: Atom, glow: "shadow-primary/10 dark:shadow-primary/20 group-hover:shadow-primary/30", bar: "bg-gradient-to-r from-primary to-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.5)]", badge: "bg-primary/10 text-primary-400 border-primary/20" },
  BookOpen:       { theme: "border-t-sky-500 hover:border-sky-400/50", icon: BookOpen, glow: "shadow-sky-500/10 dark:shadow-sky-500/20 group-hover:shadow-sky-500/30", bar: "bg-gradient-to-r from-sky-500 to-blue-400 shadow-[0_0_8px_rgba(14,165,233,0.5)]", badge: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
};

function getModuleStyle(icon: string | null, name: string) {
  if (icon && iconThemeMap[icon]) return iconThemeMap[icon];

  // Fallback keyword matching
  const n = name.toUpperCase();
  if (n.includes("CNS") || n.includes("NEURO"))                return iconThemeMap.Brain;
  if (n.includes("CARDIO") || n.includes("ECE") || n.includes("ENDO") || n.includes("RESP")) return iconThemeMap.Heart;
  if (n.includes("GENETIC") || n.includes("CELL") || n.includes("GENE") || n.includes("MICRO")) return iconThemeMap.Dna;
  if (n.includes("BIOCHEM") || n.includes("PHARMA") || n.includes("RENAL")) return iconThemeMap.FlaskConical;
  if (n.includes("GIT") || n.includes("GI") || n.includes("NUTRI")) return iconThemeMap.Layers;
  return iconThemeMap.Atom;
}

export default function ModulesGrid({ modules, totalMastered, isGuest, currentStreak }: ModulesGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "mastery" | "lectures">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleCount, setVisibleCount] = useState(9);
  const [expandedSubjects, setExpandedSubjects] = useState<string | null>(null);

  // Debounce search
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(value), 200);
  }, []);

  // Category tabs with shorter mobile-friendly labels
  const categories = [
    { id: "ALL", label: "All", labelMobile: "All" },
    { id: "CNS", label: "Nervous System", labelMobile: "CNS" },
    { id: "CARDIO", label: "Cardiopulmonary", labelMobile: "Cardio" },
    { id: "CELL", label: "Genetics & Micro", labelMobile: "Genetics" },
    { id: "PHARMA", label: "Biochem & Pharma", labelMobile: "Biochem" },
    { id: "GI", label: "Gastrointestinal", labelMobile: "GI" },
  ];

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

  // Filter, sort and slice modules
  const filteredAndSortedModules = useMemo(() => {
    let result = modules.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        matchesCategory(m.name, selectedCategory)
    );

    if (sortBy === "name") {
      result.sort((a, b) => sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    } else if (sortBy === "mastery") {
      result.sort((a, b) => sortDir === "asc" ? a.percentage - b.percentage : b.percentage - a.percentage);
    } else if (sortBy === "lectures") {
      result.sort((a, b) => sortDir === "asc" ? a.lecturesCount - b.lecturesCount : b.lecturesCount - a.lecturesCount);
    }

    return result;
  }, [modules, searchQuery, selectedCategory, sortBy, sortDir]);

  const visibleModules = useMemo(() => filteredAndSortedModules.slice(0, visibleCount), [filteredAndSortedModules, visibleCount]);
  const hasMore = visibleCount < filteredAndSortedModules.length;

  // Stats
  const avgMastery = useMemo(() => {
    if (modules.length === 0) return 0;
    return Math.round(modules.reduce((acc, m) => acc + m.percentage, 0) / modules.length);
  }, [modules]);

  const totalLectures = useMemo(() => modules.reduce((acc, m) => acc + m.lecturesCount, 0), [modules]);

  const levelInfo = useMemo(() => {
    const pointsPerLevel = 150;
    const level = Math.floor(totalMastered / pointsPerLevel) + 1;
    const currentProgress = totalMastered % pointsPerLevel;
    return { level, currentProgress, totalNeeded: pointsPerLevel, pct: Math.round((currentProgress / pointsPerLevel) * 100) };
  }, [totalMastered]);

  const sortLabel = sortDir === "asc" ? "Ascending" : "Descending";

  return (
    <div className="space-y-8 md:space-y-12">
      {/* ── METRICS DASHBOARD ── */}
      {!isGuest && modules.length > 0 && (
        <>
          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid gap-4 grid-cols-3">
            {/* Mastery */}
            <div className="relative overflow-hidden rounded-[32px] border border-white/[0.04] bg-[#0d0e1b]/70 p-6 shadow-2xl backdrop-blur-xl flex items-center gap-6">
              <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="relative shrink-0 flex items-center justify-center h-20 w-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-white/[0.04] fill-none" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" className="stroke-primary fill-none transition-all duration-1000" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - avgMastery / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-white">{avgMastery}%</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-400/80 flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Mastery Score
                </span>
                <h3 className="text-xl font-black text-white">Curriculum Health</h3>
                {avgMastery === 0 ? (
                  <p className="text-[10px] text-white/40 font-semibold">Start practicing to build your mastery!</p>
                ) : (
                  <p className="text-[10px] text-white/40 font-semibold">Average mastery across all modules.</p>
                )}
              </div>
            </div>

            {/* Level */}
            <div className="relative overflow-hidden rounded-[32px] border border-white/[0.04] bg-[#0d0e1b]/70 p-6 shadow-2xl backdrop-blur-xl">
              <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> Rank Progress
                </span>
                <span className="text-[11px] font-black text-white bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-500/30">
                  Level {levelInfo.level}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <h3 className="text-lg font-black text-white leading-none">Mastery Level</h3>
                  <span className="text-xs text-white/50 font-bold">{levelInfo.currentProgress} / {levelInfo.totalNeeded} XP</span>
                </div>
                <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${levelInfo.pct}%` }} />
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  {levelInfo.totalNeeded - levelInfo.currentProgress} Qs to Level {levelInfo.level + 1}
                </p>
              </div>
            </div>

            {/* Streak */}
            <div className="relative overflow-hidden rounded-[32px] border border-white/[0.04] bg-[#0d0e1b]/70 p-6 shadow-2xl backdrop-blur-xl flex items-center gap-6">
              <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/5">
                <Flame className="h-8 w-8 text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Study Streak
                </span>
                <h3 className="text-xl font-black text-white">{currentStreak} Day{currentStreak !== 1 ? "s" : ""} Active</h3>
                {currentStreak === 0 ? (
                  <p className="text-[10px] text-white/40 font-semibold">Answer questions to start your streak!</p>
                ) : (
                  <p className="text-[10px] text-white/40 font-semibold">Keep it up, future doctor!</p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile: compact 3-column stats (inspired by Img 2) */}
          <div className="flex md:hidden gap-2">
            <div className="mobile-card p-3 flex-1 flex flex-col items-center gap-1.5">
              <div className="relative h-10 w-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="17" className="stroke-white/[0.04] fill-none" strokeWidth="3" />
                  <circle cx="20" cy="20" r="17" className="stroke-purple-500 fill-none" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 17}`}
                    strokeDashoffset={`${2 * Math.PI * 17 * (1 - avgMastery / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{avgMastery}%</span>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Mastery</span>
            </div>
            <div className="mobile-card p-3 flex-1 flex flex-col items-center gap-1.5">
              <Award className="h-5 w-5 text-violet-400" />
              <span className="text-xs font-black text-white">Lv.{levelInfo.level}</span>
              <span className="text-[8px] font-black text-white/40">{levelInfo.currentProgress} XP</span>
            </div>
            <div className="mobile-card p-3 flex-1 flex flex-col items-center gap-1.5">
              <Flame className="h-5 w-5 text-amber-400" />
              <span className="text-xs font-black text-white">{currentStreak}d</span>
              <span className="text-[8px] font-black text-white/40">Streak</span>
            </div>
          </div>
        </>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center justify-between p-2.5 md:p-4 rounded-2xl md:rounded-[28px] border border-white/[0.03] bg-white/[0.01] backdrop-blur-md">
        {/* Category Tabs (Horizontal Scrollable) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5" role="tablist" aria-label="Filter modules by category">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setVisibleCount(9); }}
              role="tab"
              aria-selected={selectedCategory === cat.id}
              aria-label={`Filter by ${cat.label}`}
              className={cn(
                "px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider shrink-0 transition-all duration-300 border active:scale-95",
                selectedCategory === cat.id
                  ? "bg-primary border-primary/20 text-white shadow-lg shadow-primary/20 scale-[1.03]"
                  : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.08]"
              )}
            >
              <span className="md:hidden">{cat.labelMobile}</span>
              <span className="hidden md:inline">{cat.label}</span>
            </button>
          ))}
        </div>

          {/* Search & Sort Panel */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Box — larger on mobile */}
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-4 md:w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Search modules"
                className="w-full pl-10 md:pl-11 pr-4 py-3 md:py-2.5 rounded-full text-sm md:text-xs font-semibold text-white bg-white/[0.04] border border-white/[0.06] placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => {
                const modes: Array<"name" | "mastery" | "lectures"> = ["name", "mastery", "lectures"];
                const idx = modes.indexOf(sortBy);
                setSortBy(modes[(idx + 1) % 3]);
              }}
              aria-label={`Sort by ${sortBy}, currently ${sortLabel}`}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-l-full text-[10px] md:text-xs font-black uppercase tracking-widest text-white/60 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:text-white active:bg-white/[0.08] transition-all"
            >
              <ArrowUpDown className="h-3.5 w-3.5 md:h-3.5 md:w-3.5" />
              <span className="hidden md:inline">Sort: </span>
              <span className="text-[9px] md:text-xs">{sortBy === "name" ? "Name" : sortBy === "mastery" ? "Mastery" : "Lectures"}</span>
            </button>
            <button
              onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
              aria-label={`Change sort direction to ${sortDir === "asc" ? "descending" : "ascending"}`}
              className="flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-r-full text-white/60 bg-white/[0.02] border border-l-0 border-white/5 hover:bg-white/[0.05] hover:text-white active:bg-white/[0.08] transition-all shrink-0"
            >
              {sortDir === "asc" ? <ArrowUp className="h-3 w-3 md:h-3.5 md:w-3.5" /> : <ArrowDown className="h-3 w-3 md:h-3.5 md:w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD GRID ── */}
      {filteredAndSortedModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] md:rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] py-16 md:py-24 text-center">
          <div className="mb-5 md:mb-6 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-[16px] md:rounded-[20px] bg-white/5 text-white/20">
            {searchQuery || selectedCategory !== "ALL" ? (
              <Search className="h-7 w-7 md:h-8 md:w-8" />
            ) : (
              <Library className="h-7 w-7 md:h-8 md:w-8" />
            )}
          </div>
          <h3 className="text-base md:text-lg font-black text-white uppercase tracking-widest">No Modules Found</h3>
          <p className="mt-2 text-white/40 text-xs font-semibold max-w-xs mx-auto">
            {searchQuery || selectedCategory !== "ALL"
              ? "Try adjusting your search criteria or category filter."
              : "No modules are available in your current semester."}
          </p>
        </div>
      ) : (
        <div className="space-y-8 md:space-y-0">
          <motion.div 
            layout
            className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {visibleModules.map((mod, index) => {
                const modStyle = getModuleStyle(mod.icon, mod.name);
                const CardIcon = modStyle.icon;
                const showAllSubjects = expandedSubjects === mod.id;

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
                    <Link
                      href={isGuest ? "/login" : `/modules/${mod.id}`}
                      aria-label={`Open module: ${mod.name}`}
                    >
                      <div className={cn(
                        "relative flex flex-col bg-card/45 dark:bg-[#0c0d18]/45 border border-white/[0.03] rounded-2xl md:rounded-[32px] p-4 md:p-6 transition-all duration-300 cursor-pointer shadow-xl hover:-translate-y-1 active:scale-[0.98] hover:bg-white/[0.01] border-t-2",
                        modStyle.theme,
                        modStyle.glow
                      )}>
                        <div className="absolute inset-0 rounded-2xl md:rounded-[32px] bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />

                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-4 md:mb-6">
                          <div className={cn(
                            "h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden transition-transform duration-500 group-hover:scale-110 active:scale-95",
                            "bg-white/[0.02]"
                          )}>
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                            <CardIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                          </div>

                          {mod.difficulty && (
                            <span className={cn(
                              "px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border",
                              mod.difficulty.bg,
                              mod.difficulty.tone,
                              "border-white/[0.02]"
                            )}>
                              {mod.difficulty.label}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="space-y-3 md:space-y-4 flex-1">
                          <div className="space-y-0.5 md:space-y-1">
                            <h3 className="text-[15px] md:text-[17px] font-black text-white group-hover:text-primary transition-colors duration-200 line-clamp-1 leading-tight">
                              {mod.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-wider">
                              <span className="text-primary-400">{mod.subjectsCount} Subj</span>
                              <span>|</span>
                              <span>{mod.lecturesCount} Lec</span>
                              <span>|</span>
                              <span>{mod.questionsCount} Qs</span>
                            </div>
                          </div>

                          {/* Subject badges — hidden on mobile */}
                          {mod.subjectNames.length > 0 && (
                            <div className="hidden sm:flex flex-wrap gap-1 py-1 max-h-[58px] overflow-hidden">
                              {mod.subjectNames.slice(0, showAllSubjects ? mod.subjectNames.length : 3).map((subName) => (
                                <span key={subName} className="px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-[9px] font-bold text-white/40 truncate max-w-[100px]">
                                  {subName}
                                </span>
                              ))}
                              {mod.subjectNames.length > 3 && !showAllSubjects && (
                                <button
                                  onClick={(e) => { e.preventDefault(); setExpandedSubjects(mod.id); }}
                                  aria-label={`Show all ${mod.subjectNames.length} subjects`}
                                  className="px-1.5 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-[9px] font-black text-white/30 hover:text-white/50 transition-colors"
                                >
                                  +{mod.subjectNames.length - 3}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="space-y-1.5 md:space-y-2 pt-1 md:pt-2">
                            <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                              <span className="text-white/30">Mastery</span>
                              <span className="text-primary">{mod.percentage}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden relative">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000", modStyle.bar)} 
                                style={{ width: `${mod.percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Enter module — hidden label on mobile (card is tappable), visible chevron */}
                          <div className="pt-1 md:pt-2 flex items-center justify-end text-[10px] md:text-xs font-black text-white/60 md:text-white/40 md:group-hover:text-primary uppercase tracking-widest transition-colors duration-200">
                            <span className="hidden md:inline mr-2">Enter</span>
                            <ChevronRight className="h-4 w-4 md:h-4 md:w-4 transform md:group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2 md:pt-4">
              <button
                onClick={() => setVisibleCount((c) => c + 9)}
                aria-label="Load more modules"
                className="inline-flex items-center gap-2 px-8 py-3.5 md:px-6 md:py-3 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-black text-white/60 uppercase tracking-widest hover:bg-white/[0.06] hover:text-white active:scale-95 transition-all"
              >
                Show More
                <ChevronRight className="h-3.5 w-3.5 transform rotate-90" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
