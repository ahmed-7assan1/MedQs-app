"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FileText, Clock, BarChart3, ChevronRight, LayoutList, LayoutGrid, LayoutTemplate, Trophy, Target, TrendingUp, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuestPaper = {
  id: string;
  title: string;
  timeLimitMin: number | null;
  module: { name: string };
  _count: { attempts: number };
};

export type GuestAttempt = {
  id: string;
  pastPaperId: string;
  score: number;
  createdAt: Date;
};

export function PaperList({ papers, allAttempts }: { papers: GuestPaper[], allAttempts: GuestAttempt[] }) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [layoutMode, setLayoutMode] = useState<"list" | "grid" | "mixed">("list");

  useEffect(() => {
    const pref = localStorage.getItem("quiz-layout-pref") as any;
    if (pref && ["list", "grid", "mixed"].includes(pref)) {
      setLayoutMode(pref);
    }
    setHasHydrated(true);
  }, []);

  const handleLayoutChange = (mode: "list" | "grid" | "mixed") => {
    setLayoutMode(mode);
    localStorage.setItem("quiz-layout-pref", mode);
  };

  const bestByPaper = useMemo(() => {
    const map = new Map<string, {score: number; id: string}>();
    for (const a of allAttempts) {
      const cur = map.get(a.pastPaperId);
      if (!cur || a.score > cur.score) {
         map.set(a.pastPaperId, { score: a.score, id: a.id });
      }
    }
    return map;
  }, [allAttempts]);

  const uniqueModules = useMemo(() => {
    const set = new Set(papers.map(p => p.module.name));
    return ["All", ...Array.from(set).sort()];
  }, [papers]);

  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
       if (moduleFilter !== "All" && p.module.name !== moduleFilter) return false;
       if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
       
       const best = bestByPaper.get(p.id);
       if (statusFilter === "Attempted" && !best) return false;
       if (statusFilter === "Not Started" && best) return false;
       return true;
    });
  }, [papers, moduleFilter, searchTerm, statusFilter, bestByPaper]);

  const stats = useMemo(() => {
     const visibleIds = new Set(filteredPapers.map(p => p.id));
     const relevantAttempts = allAttempts.filter(a => visibleIds.has(a.pastPaperId));

     const totalAttempts = relevantAttempts.length;

     const thirtyDaysAgo = new Date();
     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
     // Note: strict Date parsing
     const recentAttempts = relevantAttempts.filter(a => new Date(a.createdAt) >= thirtyDaysAgo);
     const avgScore = recentAttempts.length > 0
        ? Math.round(recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length)
        : 0;

     let bestScore = -1;
     let bestPaperName = "";
     for (const a of relevantAttempts) {
        if (a.score > bestScore) {
           bestScore = a.score;
           const p = filteredPapers.find(pf => pf.id === a.pastPaperId);
           if (p) {
               bestPaperName = p.title;
           }
        }
     }

     const attemptedIds = new Set(relevantAttempts.map(a => a.pastPaperId));
     return {
        totalAttempts,
        avgScore,
        bestScore: bestScore === -1 ? 0 : bestScore,
        bestPaperName: bestPaperName || "N/A",
        completionRatio: `${attemptedIds.size} / ${filteredPapers.length}`
     };
  }, [filteredPapers, allAttempts]);

  const papersByModule = useMemo(() => {
    return filteredPapers.reduce((acc, paper) => {
      const mod = paper.module.name;
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(paper);
      return acc;
    }, {} as Record<string, GuestPaper[]>);
  }, [filteredPapers]);

  if (!hasHydrated) {
    return <div className="h-[600px] w-full animate-pulse rounded-2xl bg-muted/40" />;
  }

  const renderBadge = (score?: number) => {
    if (score === undefined) return <span className="rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground w-fit">لم يبدأ</span>;
    let tone = "";
    let label = "";
    if (score >= 70) { tone = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"; label = "ممتاز"; }
    else if (score >= 50) { tone = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"; label = "متوسط"; }
    else { tone = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"; label = "يحتاج مراجعة"; }
    return (
      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold w-fit", tone)}>
        {score}% - {label}
      </span>
    );
  };

  const getProgressColor = (score: number) => {
     if (score >= 70) return "bg-emerald-500";
     if (score >= 50) return "bg-amber-500";
     if (score > 0) return "bg-red-500";
     return "bg-muted-foreground/20";
  };

  const renderPaperCard = (paper: GuestPaper, mode: "list" | "grid" | "hero") => {
    const best = bestByPaper.get(paper.id);
    const score = best?.score;
    const isHero = mode === "hero";
    
    return (
       <div key={paper.id} className={cn(
          "group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md dark:border-white/10 dark:hover:border-sky-500/30",
          mode === "list" ? "p-4" : "p-5 flex flex-col justify-between"
       )}>
          <div className={cn("flex", mode === "list" ? "items-center justify-between gap-4" : "flex-col items-start gap-4")}>
             
             {/* Left side/Top */}
             <div className="flex w-full min-w-0 items-start gap-4">
                <div className={cn("flex flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/10", isHero ? "h-14 w-14" : "h-10 w-10")}>
                   <FileText className={cn("text-sky-500", isHero ? "h-7 w-7" : "h-5 w-5")} />
                </div>
                <div className="min-w-0 flex-1">
                   <h3 className={cn("font-bold text-foreground transition-colors group-hover:text-primary", isHero ? "text-xl font-display" : "text-sm")}>{paper.title}</h3>
                   <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground/80">
                      <span>{paper.module.name}</span>
                      {paper.timeLimitMin && (
                         <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {paper.timeLimitMin} min</span>
                      )}
                      <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {paper._count.attempts > 0 ? paper._count.attempts : "0"} attempts</span>
                   </div>
                </div>
             </div>

             {/* Right side/Bottom */}
             <div className={cn("flex flex-shrink-0", mode === "list" ? "items-center gap-6" : "w-full flex-col gap-4")}>
                
                {/* Progress Bar & Badge */}
                <div className={cn("flex flex-col gap-1.5", mode === "list" ? "w-32" : "w-full")}>
                   <div className="flex items-center justify-between gap-2">
                       {renderBadge(score)}
                   </div>
                   {score !== undefined && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                         <div className={cn("h-full rounded-full transition-all duration-700", getProgressColor(score))} style={{ width: `${score}%` }} />
                      </div>
                   )}
                </div>

                <Link
                   href={`/guest/quiz/${paper.id}`}
                   className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2",
                      score !== undefined
                         ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                         : "bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20",
                      mode === "list" ? "px-4 py-2" : "w-full py-2.5 mt-auto"
                   )}
                >
                   {score !== undefined ? "إعادة" : "Start"}
                   <ChevronRight className="h-4 w-4" />
                </Link>
             </div>
          </div>
       </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
       
      {/* 1. Stats Summary Bar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
         {[
            { label: "Total Attempts", value: stats.totalAttempts, icon: Target, tone: "text-blue-500", bgTone: "bg-blue-500/10" },
            { label: "Average Score (30d)", value: `${stats.avgScore}%`, icon: TrendingUp, tone: "text-emerald-500", bgTone: "bg-emerald-500/10" },
            { label: "Best Score", value: `${stats.bestScore}%`, sub: stats.bestPaperName, icon: Trophy, tone: "text-amber-500", bgTone: "bg-amber-500/10" },
            { label: "Completion", value: stats.completionRatio, icon: BarChart3, tone: "text-purple-500", bgTone: "bg-purple-500/10" },
         ].map((s, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 transition-all hover:border-border/80">
               <div className="flex items-start justify-between">
                  <div>
                     <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                     <p className="mt-1 font-display text-2xl font-bold tracking-tight">{s.value}</p>
                     {s.sub && <p className="mt-1 truncate text-[10px] sm:text-xs font-semibold text-muted-foreground max-w-[120px] sm:max-w-[160px]">{s.sub}</p>}
                  </div>
                  <div className={cn("rounded-xl p-2.5", s.bgTone, s.tone)}>
                     <s.icon className="h-5 w-5" />
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* 2. Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-2 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
         <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <input
                  type="text"
                  placeholder="Search papers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm font-medium outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
               />
            </div>
            <div className="flex gap-2">
               <div className="relative">
                 <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="h-10 appearance-none rounded-xl border border-border bg-background pl-3 pr-8 text-sm font-medium outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                 >
                    {uniqueModules.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
               </div>
               <div className="relative">
                 <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 appearance-none rounded-xl border border-border bg-background pl-3 pr-8 text-sm font-medium outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                 >
                    <option value="All">All Status</option>
                    <option value="Attempted">Attempted</option>
                    <option value="Not Started">Not Started</option>
                 </select>
                 <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
               </div>
            </div>
         </div>

         {/* 3. Layout Toggle */}
         <div className="flex items-center gap-1 rounded-xl bg-background p-1 border border-border">
            {[ 
               { id: "list", icon: LayoutList, title: "List View" },
               { id: "grid", icon: LayoutGrid, title: "Grid View" },
               { id: "mixed", icon: LayoutTemplate, title: "Mixed View" },
            ].map(m => (
               <button
                  key={m.id}
                  title={m.title}
                  onClick={() => handleLayoutChange(m.id as "list"|"grid"|"mixed")}
                  className={cn(
                     "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                     layoutMode === m.id ? "bg-sky-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
               >
                  <m.icon className="h-4 w-4" />
               </button>
            ))}
         </div>
      </div>

      {/* Empty State */}
      {filteredPapers.length === 0 ? (
         <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 py-20 bg-muted/10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-3">
               <Search className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-display text-lg font-bold">No papers found</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground max-w-sm text-center">
               We couldn't find any papers matching your current filters. Try adjusting your search or clearing the filters.
            </p>
         </div>
      ) : (
         /* 4. Grouped Layout Rendering */
         <div className="space-y-10">
            {Object.entries(papersByModule).sort(([a], [b]) => a.localeCompare(b)).map(([moduleName, modPapers]) => (
               <section key={moduleName} className="animate-fade-in">
                  <div className="mb-4 flex items-center gap-3">
                     <h2 className="font-display text-xl font-bold tracking-tight">{moduleName}</h2>
                     <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {modPapers.length} quizzes
                     </span>
                     <div className="h-px flex-1 bg-border/40" />
                  </div>

                  {layoutMode === "list" && (
                     <div className="flex flex-col gap-3">
                        {modPapers.map(p => renderPaperCard(p, "list"))}
                     </div>
                  )}

                  {layoutMode === "grid" && (
                     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {modPapers.map(p => renderPaperCard(p, "grid"))}
                     </div>
                  )}

                  {layoutMode === "mixed" && (() => {
                     // Find highest scored paper, fallback to first
                     let heroPaper = modPapers.find(p => bestByPaper.has(p.id)) || modPapers[0];
                     // Actual best logic
                     const withScores = modPapers.filter(p => bestByPaper.has(p.id)).sort((a,b) => (bestByPaper.get(b.id)?.score || 0) - (bestByPaper.get(a.id)?.score || 0));
                     if (withScores.length > 0) heroPaper = withScores[0];
                     
                     const gridPapers = modPapers.filter(p => p.id !== heroPaper.id);

                     return (
                        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-4">
                           <div className="lg:col-span-2">
                              {renderPaperCard(heroPaper, "hero")}
                           </div>
                           {gridPapers.length > 0 && (
                              <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
                                 {gridPapers.map(p => renderPaperCard(p, "grid"))}
                              </div>
                           )}
                        </div>
                     );
                  })()}
               </section>
            ))}
         </div>
      )}
    </div>
  );
}
