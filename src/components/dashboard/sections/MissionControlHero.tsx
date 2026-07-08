"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Trophy, Sparkles, GraduationCap, TrendingUp, Bell, Sun, Moon, Maximize, Minimize, FileText, ChevronRight, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore, useNotificationStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardData, QuizCardData } from "@/types/dashboard";

export function MissionControlHero({ data, onToggleSidebar, sidebarOpen }: { data: DashboardData; onToggleSidebar?: () => void; sidebarOpen?: boolean }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizCardData | null>(null);
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();
  const { notifications, unread, setNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => { setMounted(true); }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (notifOpen && notifications.length === 0) {
      fetch("/api/v1/notifications")
        .then((r) => r.json())
        .then((data) => setNotifications(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [notifOpen]);

  return (
    <TooltipProvider>
      <div className="hero-mesh">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="relative h-16 w-16 md:h-20 md:w-20">
              <svg className="absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-white/5" />
                <motion.circle
                  cx="50" cy="50" r="44" fill="none" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={Math.PI * 88}
                  initial={{ strokeDashoffset: Math.PI * 88 }}
                  animate={{ strokeDashoffset: Math.PI * 88 - (Math.PI * 88 * data.progressToNext) / 100 }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    data.rankLabel === "Elite" ? "stroke-amber-500" :
                    data.rankLabel === "Expert" ? "stroke-purple-500" :
                    data.rankLabel === "Contributor" ? "stroke-blue-500" :
                    data.rankLabel === "Active" ? "stroke-emerald-500" :
                    "stroke-slate-400"
                  )}
                />
              </svg>
              <Avatar className="h-full w-full shrink-0 shadow-lg shadow-primary/20">
                {data.userImage ? (
                  <AvatarImage src={data.userImage} alt={data.firstName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl md:text-2xl font-black">
                  {data.firstName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-lg shadow-emerald-500/30" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-[0.2em]">
                {data.greeting}
              </span>
              {data.overallPct >= 80 && (
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Top Performer
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter text-foreground leading-none">
              Dr. {data.firstName}
            </h1>
            <p className="mt-1.5 text-xs font-medium text-muted-foreground/70 flex items-center gap-1.5 flex-wrap">
              <GraduationCap className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-foreground/80 font-bold">{data.rankLabel}</span>
            </p>
          </div>
        </div>

          <div className="flex gap-1.5 shrink-0">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 bg-card/40",
            data.currentStreak > 0 && "border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/0"
          )}>
            <Flame className={cn("h-4 w-4", data.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground")} />
            <span className={cn("text-base font-black tabular-nums leading-none", data.currentStreak > 0 ? "text-red-500" : "text-muted-foreground")}>{data.currentStreak}</span>
            <span className="text-[9px] font-medium text-muted-foreground/60">day streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 bg-card/40 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/0">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-base font-black tabular-nums leading-none text-foreground">{(data.rankPoints || 0).toLocaleString()}</span>
            <span className="text-[9px] font-medium text-muted-foreground/60">XP</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setNotifOpen(true)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30 border border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-primary transition-all"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30 border border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-primary transition-all"
                >
                  {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleFullscreen}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30 border border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-primary transition-all"
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</TooltipContent>
            </Tooltip>
            {onToggleSidebar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleSidebar}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30 border border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-primary transition-all"
                  >
                    <PanelLeft className={cn("h-4 w-4 transition-transform duration-500", sidebarOpen && "rotate-180")} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{sidebarOpen ? "Close sidebar" : "Open sidebar"}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8 flex flex-col items-end">
        {data.recentQuizzes.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-8 w-full">No quizzes yet</p>
        ) : (
          data.recentQuizzes.slice(0, 3).map((quiz, i) => {
            const scoreColor = quiz.bestScore !== null
              ? quiz.bestScore >= 70 ? "text-emerald-500" : quiz.bestScore >= 50 ? "text-amber-500" : "text-red-500"
              : "text-muted-foreground/40";
            return i === 0 ? (
              <button key={quiz.id} onClick={() => router.push("/past-papers")} className="relative text-left transition-all duration-300 hover:-translate-y-2 hover:z-50" style={{ zIndex: 3 }}>
                <Card className="group w-[280px] md:w-[320px] lg:w-[300px] rounded-xl bg-card border-border/30 p-3 shadow-sm flex items-center gap-2.5 transition-all duration-300 hover:shadow-md hover:border-primary/40 cursor-pointer">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-foreground truncate leading-tight">{quiz.title}</p>
                    <p className="text-[8px] font-bold text-foreground/40 uppercase tracking-wider">{quiz.moduleName}</p>
                    {quiz.bestScore !== null && (
                      <p className={cn("text-[9px] font-bold mt-0.5", scoreColor)}>Best: {quiz.bestScore}%</p>
                    )}
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                </Card>
              </button>
            ) : (
              <div key={quiz.id} className="relative pointer-events-none" style={{ marginTop: -52 }}>
                <Card className="w-[280px] md:w-[320px] lg:w-[300px] rounded-xl bg-card border-border/20 p-3 shadow-sm flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 shrink-0">
                    <FileText className="h-3.5 w-3.5 text-primary/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-foreground/40 truncate leading-tight">{quiz.title}</p>
                    <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-wider">{quiz.moduleName}</p>
                  </div>
                </Card>
              </div>
            );
          })
        )}
      </div>

      {data.dailyTarget > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
            <span className="text-muted-foreground/60 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary/60" />
              Daily Target
            </span>
            <span className="text-foreground/80">{data.todayItemCount} / {data.dailyTarget}</span>
          </div>
          <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-0 rounded-full opacity-20 blur-sm"
              style={{
                width: `${data.dailyPct}%`,
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
              }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.dailyPct}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full rounded-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </div>
      )}

      {/* Notifications Dialog */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogTitle className="sr-only">Notifications</DialogTitle>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-black uppercase tracking-wider text-foreground/60">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3.5 rounded-xl text-left transition-all",
                    !n.read
                      ? "bg-primary/5 border border-primary/15"
                      : "hover:bg-muted/30 border border-transparent"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-semibold", !n.read ? "text-foreground" : "text-muted-foreground/70")}>
                      {n.title}
                    </p>
                    <p className={cn("mt-0.5 text-xs leading-relaxed line-clamp-2", !n.read ? "text-muted-foreground/80" : "text-muted-foreground/50")}>
                      {n.body}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground/40">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz confirmation dialog */}
      <Dialog open={!!selectedQuiz} onOpenChange={(open) => { if (!open) setSelectedQuiz(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="sr-only">Start Quiz</DialogTitle>
          <div className="py-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">{selectedQuiz?.title}</h3>
            <p className="text-sm font-medium text-muted-foreground mb-1">{selectedQuiz?.moduleName}</p>
            {selectedQuiz?.bestScore !== null && (
              <p className={cn("text-xs font-bold mt-2", selectedQuiz && (
                selectedQuiz.bestScore >= 70 ? "text-emerald-500" : selectedQuiz.bestScore >= 50 ? "text-amber-500" : "text-red-500"
              ))}>Previous best: {selectedQuiz?.bestScore}%</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSelectedQuiz(null)} className="flex-1">Cancel</Button>
            <Button onClick={() => { router.push(`/quiz/${selectedQuiz?.id}`); setSelectedQuiz(null); }} className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-lg shadow-primary/20">
              Start Quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
