"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Trophy, Sparkles, GraduationCap, TrendingUp, Bell, Sun, Moon, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore, useNotificationStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardData } from "@/types/dashboard";

export function MissionControlHero({ data }: { data: DashboardData }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
            <Avatar className="h-16 w-16 md:h-20 md:w-20 shrink-0 shadow-lg shadow-primary/20">
              {data.userImage ? (
                <AvatarImage src={data.userImage} alt={data.firstName} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl md:text-2xl font-black">
                {data.firstName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-lg shadow-emerald-500/30" />
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

        <div className="flex gap-2 shrink-0">
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
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8 flex items-stretch gap-3 md:gap-4 flex-wrap">
        {(data.moduleProgress?.slice(0, 4) || []).map((mod) => (
          <Link
            key={mod.id}
            href={`/modules/${mod.id}`}
            className="flex-1 min-w-[120px] p-3.5 rounded-xl bg-card/40 backdrop-blur-sm border border-white/5 dark:border-white/10 hover:bg-card/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block truncate">
              {mod.name}
            </span>
            <span className="text-xl md:text-2xl font-black tracking-tighter tabular-nums text-foreground">
              {mod.pct}%
            </span>
            <div className="mt-1.5 h-1 w-full bg-muted/50 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 relative overflow-hidden"
                style={{ width: `${mod.pct}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </Link>
        ))}
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
      </div>
    </TooltipProvider>
  );
}
