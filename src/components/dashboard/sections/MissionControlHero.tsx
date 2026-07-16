"use client";

import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Bell, Sun, Moon, Sparkles, Flame, Trophy, CheckCircle2, HelpCircle, GraduationCap, Zap, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore, useNotificationStore } from "@/lib/store";
import { NotificationsSheet } from "@/components/layout/NotificationsSheet";
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

        <div className="relative space-y-2 md:space-y-4">
<div className="flex items-start justify-between sm:gap-4 gap-3">
          <div className="flex items-center sm:gap-4 gap-3 min-w-0">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="sm:h-20 sm:w-20 h-16 w-16 rounded-3xl border-2 dark:border-white/[0.05] border-slate-200 p-1 transition-all duration-500 overflow-hidden shadow-sm">
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
                        <span className="text-lg font-black text-foreground">{firstLetter}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="hidden md:block w-full">
                  <div className="h-1 w-full bg-muted-foreground/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.progressToNext}%` }}
                      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground tabular-nums text-center block mt-0.5">
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
                <h1 className="text-lg md:text-2xl font-black tracking-tight text-foreground leading-none">
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

          <div className="md:border-t md:border-border/10 md:pt-3">
            <div className="flex items-center justify-between md:justify-start gap-x-3 md:gap-x-6">
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
                    <Icon className={cn("sm:h-3 sm:w-3 h-3.5 w-3.5", metric.color)} />
                    <span className="sm:text-xs text-sm font-black text-foreground tabular-nums leading-none">{metric.value}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none hidden md:inline">{metric.label}</span>
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

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </TooltipProvider>
  );
});
