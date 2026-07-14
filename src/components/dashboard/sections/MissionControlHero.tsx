"use client";

import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Bell, Sun, Moon, Sparkles, Flame, Trophy, CheckCircle2, HelpCircle, GraduationCap, Zap, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore, useNotificationStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardData } from "@/types/dashboard";

const FALLBACK_GRADIENTS = [
  "from-blue-500/20 to-blue-600/20",
  "from-violet-500/20 to-violet-600/20",
  "from-emerald-500/20 to-emerald-600/20",
  "from-rose-500/20 to-rose-600/20",
  "from-amber-500/20 to-amber-600/20",
  "from-cyan-500/20 to-cyan-600/20",
];

const RANK_CONFIG: Record<string, { color: string }> = {
  Newbie:       { color: "#64748B" },
  Active:       { color: "#06B6D4" },
  Contributor:  { color: "#8B5CF6" },
  Expert:       { color: "#D97706" },
  Elite:        { color: "#E11D48" },
};

const RANK_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Newbie: GraduationCap,
  Active: Zap,
  Contributor: Flame,
  Expert: Medal,
  Elite: Crown,
};

export const MissionControlHero = memo(function MissionControlHero({
  data,
}: {
  data: DashboardData;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const { notifications, unread, setNotifications, markRead, markAllRead } = useNotificationStore();
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (notifOpen && notifications.length === 0) {
      fetch("/api/v1/notifications")
        .then((r) => r.json())
        .then((notifs) => setNotifications(Array.isArray(notifs) ? notifs : []))
        .catch(() => {});
    }
  }, [notifOpen]);

  const rankConfig = RANK_CONFIG[data.rankLabel] || { color: "hsl(var(--primary))" };
  const RankIconComponent = RANK_ICONS[data.rankLabel] || Medal;
  const firstLetter = data.firstName.charAt(0).toUpperCase();
  const gradientIndex = firstLetter.charCodeAt(0) % FALLBACK_GRADIENTS.length;

  const metrics = [
    { icon: Flame, value: `${data.currentStreak}d`, label: "Streak", color: "text-orange-500" },
    { icon: Trophy, value: data.rankPoints.toLocaleString(), label: "XP", color: "text-amber-500" },
    { icon: CheckCircle2, value: `${data.overallPct}%`, label: "Accuracy", color: "text-sky-500" },
    { icon: HelpCircle, value: data.totalQuestions.toLocaleString(), label: "Solved", color: "text-violet-500" },
  ];

  return (
    <TooltipProvider>
      <div className={cn("rounded-2xl p-4 md:p-5 transition-all duration-500 relative overflow-hidden", "hero-gradient-night")}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="h-20 w-20 rounded-3xl border-2 dark:border-white/[0.05] border-slate-200 p-1 transition-all duration-500 overflow-hidden shadow-sm">
                  <div className="h-full w-full rounded-2xl overflow-hidden dark:bg-[#1a1a1a] bg-slate-100">
                    {data.userImage ? (
                      <img
                        src={data.userImage}
                        alt={data.firstName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className={cn("h-full w-full flex items-center justify-center bg-gradient-to-br", FALLBACK_GRADIENTS[gradientIndex])}>
                        <span className="text-lg font-black text-foreground/40">{firstLetter}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full">
                  <div className="h-1 w-full bg-muted-foreground/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.progressToNext}%` }}
                      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground/40 tabular-nums text-center block mt-0.5">
                    {data.progressToNext}%
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">
                    {data.greeting}
                  </span>
                  {data.overallPct >= 80 && (
                    <span className="text-[9px] font-black text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 leading-none border border-primary/20">
                      <Sparkles className="h-2.5 w-2.5" /> Top Performer
                    </span>
                  )}
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground leading-none">
                  Dr. {data.firstName}
                </h1>
                
                {data.rankLabel && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 mt-2 shadow-sm"
                    style={{
                      borderColor: rankConfig.color + "40",
                      background: `linear-gradient(135deg, ${rankConfig.color}15, ${rankConfig.color}08)`,
                      boxShadow: `0 2px 8px ${rankConfig.color}15`,
                    }}
                  >
                    <RankIconComponent className="h-3.5 w-3.5" style={{ color: rankConfig.color }} />
                    <span className="text-[10px] font-black tracking-wider uppercase" style={{ color: rankConfig.color }}>
                      {data.rankLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setNotifOpen(true)}
                    className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-card border border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-primary transition-all duration-200"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-card border border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-primary transition-all duration-200"
                  >
                    {mounted && theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{theme === "dark" ? "Light Mode" : "Dark Mode"}</TooltipContent>
              </Tooltip>


            </div>
          </div>

          <div className="border-t border-border/10 pt-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 md:gap-x-6">
              {metrics.map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * i }}
                    className="flex items-center gap-1.5"
                  >
                    <Icon className={cn("h-3 w-3", metric.color)} />
                    <span className="text-xs font-black text-foreground tabular-nums leading-none">{metric.value}</span>
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider leading-none">{metric.label}</span>
                    {i < metrics.length - 1 && (
                      <span className="hidden md:block ml-2 h-3 w-px bg-border/40" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
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
            <div className="space-y-1.5">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3.5 rounded-xl text-left transition-all border",
                    !n.read
                      ? "bg-primary/5 border-primary/10"
                      : "hover:bg-muted/30 border-transparent"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-bold", !n.read ? "text-foreground" : "text-muted-foreground/70")}>
                      {n.title}
                    </p>
                    <p className={cn("mt-1 text-xs leading-relaxed line-clamp-2", !n.read ? "text-muted-foreground/80" : "text-muted-foreground/50")}>
                      {n.body}
                    </p>
                    <p className="mt-1.5 text-[9px] font-bold text-muted-foreground/40">
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
    </TooltipProvider>
  );
});
