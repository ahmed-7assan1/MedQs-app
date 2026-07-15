"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Play,
  Trophy, Sparkles, Flame,
  Bell, Moon, Sun, BookOpen, TrendingUp, Target,
  AlertCircle, BrainCircuit, ArrowRight, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore, useNotificationStore } from "@/lib/store";
import { NotificationsSheet } from "@/components/layout/NotificationsSheet";
import { TodayQueue } from "@/components/dashboard/sections/TodayQueue";
import { QuickActionsStrip } from "@/components/dashboard/sections/QuickActionsStrip";
import { LearningHeatmap } from "@/components/dashboard/sections/LearningHeatmap";
import { CommunityPostsCarousel } from "@/components/dashboard/CommunityPostsCarousel";
import { generateRecommendations } from "@/components/dashboard/sections/AIRecommendations";
import type { Recommendation } from "@/components/dashboard/sections/AIRecommendations";
import { deriveTodayTasks } from "@/types/dashboard";
import type { DashboardData, LastLectureInfo } from "@/types/dashboard";

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 120];

function computeStreakProgress(streak: number): { pct: number; label: string } {
  if (streak <= 0) return { pct: 0, label: "Start" };
  const next = STREAK_MILESTONES.find((m) => m > streak) ?? streak + 1;
  const pct = Math.min(100, Math.round((streak / next) * 100));
  return { pct, label: `${streak}/${next}` };
}

function ProgressRing({
  pct,
  size = 52,
  stroke = 4,
  color,
  bgColor,
  icon: Icon,
  value,
  sublabel,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  sublabel: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} strokeLinecap="round" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" style={{ color }}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <span className="text-xs font-black text-foreground tabular-nums leading-none">{value}</span>
      <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-wider leading-none">{sublabel}</span>
    </div>
  );
}

const FEATURED_BG: Record<string, string> = {
  TrendingUp: "from-orange-500/15 via-orange-500/5 to-transparent",
  Target: "from-primary/15 via-primary/5 to-transparent",
  AlertCircle: "from-rose-500/15 via-rose-500/5 to-transparent",
  Sparkles: "from-indigo-500/15 via-indigo-500/5 to-transparent",
  Lightbulb: "from-violet-500/15 via-violet-500/5 to-transparent",
  BrainCircuit: "from-blue-500/15 via-blue-500/5 to-transparent",
  CheckCircle2: "from-emerald-500/15 via-emerald-500/5 to-transparent",
};

const FEATURED_ACCENT: Record<string, string> = {
  TrendingUp: "text-orange-500",
  Target: "text-primary",
  AlertCircle: "text-rose-500",
  Sparkles: "text-indigo-500",
  Lightbulb: "text-violet-500",
  BrainCircuit: "text-blue-500",
  CheckCircle2: "text-emerald-500",
};

function FeaturedCard({
  rec,
  index,
  total,
  activeIndex,
  onSwipe,
}: {
  rec: Recommendation;
  index: number;
  total: number;
  activeIndex: number;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const Icon = rec.icon;
  const isActive = index === activeIndex;
  const iconName = (Icon.displayName || Icon.name || "") as string;
  const bgGrad = FEATURED_BG[iconName] || "from-primary/10 via-primary/5 to-transparent";
  const accentColor = FEATURED_ACCENT[iconName] || "text-primary";

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="home-featured-card relative overflow-hidden"
          style={{ touchAction: "pan-y" }}
        >
          <Link
            href={rec.actionHref || "#"}
            className={cn(
              "block h-full w-full rounded-[24px] bg-gradient-to-br border-0 p-5 relative overflow-hidden",
              bgGrad,
              "hover:shadow-lg transition-shadow duration-300"
            )}
          >
            {/* Decorative glow */}
            <div className={cn("absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-40", bgGrad)} />

            <div className="relative h-full flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl bg-card/60 border border-white/5 shrink-0", accentColor)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-foreground leading-tight line-clamp-1">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed line-clamp-1">
                    {rec.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {rec.action && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary">
                    {rec.action} <ArrowRight className="h-3 w-3" />
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: total }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === activeIndex
                          ? "w-5 bg-primary"
                          : "w-1.5 bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CompactFocusCard({ lastLecture, firstName }: { lastLecture: LastLectureInfo | null; firstName: string }) {
  if (!lastLecture) {
    return (
      <div className="flex items-center gap-3 p-4 bg-card/40 rounded-2xl border border-border/10">
        <div className="p-2 rounded-xl bg-primary/10">
          <GraduationCap className="h-[18px] w-[18px] text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            Welcome, Dr. {firstName}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground/60 mt-0.5">
            Start your first lecture
          </p>
          <Link
            href="/modules"
            className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary mt-1.5"
          >
            <Play className="h-2.5 w-2.5 fill-current" /> Explore Modules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-card/40 rounded-2xl border border-border/10">
      <div className="p-2 rounded-xl bg-primary/10 shrink-0">
        <GraduationCap className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight line-clamp-1">
          {lastLecture.lectureTitle}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground/60 leading-tight line-clamp-1 mt-0.5">
          {lastLecture.subjectName} &middot; {lastLecture.channelName || "MedOneX"}
        </p>
        <Link
          href={`/modules/${lastLecture.moduleId}/lectures/${lastLecture.lectureId}`}
          className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary mt-1.5"
        >
          <Play className="h-2.5 w-2.5 fill-current" /> Resume
        </Link>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[9px] font-black text-primary tabular-nums">35%</span>
        <div className="h-1 w-14 bg-muted/40 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: "35%" }} />
        </div>
      </div>
    </div>
  );
}

export function DashboardMobileView({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const touchStartX = useRef(0);
  const { theme, setTheme } = useThemeStore();
  const { notifications, unread, setNotifications } = useNotificationStore();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (notifOpen && notifications.length === 0) {
      fetch("/api/v1/notifications")
        .then((r) => r.json())
        .then((notifs) => setNotifications(Array.isArray(notifs) ? notifs : []))
        .catch(() => {});
    }
  }, [notifOpen]);

  const recommendations = useMemo(() => generateRecommendations(data), [data]);
  const todayTasks = useMemo(() => deriveTodayTasks(data), [data]);

  const handleFeaturedSwipe = useCallback((dir: "left" | "right") => {
    setFeaturedIndex((prev) => {
      if (dir === "left") return Math.min(prev + 1, recommendations.length - 1);
      return Math.max(prev - 1, 0);
    });
  }, [recommendations.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      handleFeaturedSwipe(diff > 0 ? "left" : "right");
    }
  }, [handleFeaturedSwipe]);

  const moduleProgress = data.moduleProgress || [];
  const avatarLetter = data.firstName.charAt(0).toUpperCase();

  return (
    <div className="md:hidden pb-24 scroll-smooth">
      {/* ════════════════════════════════════════
          HEADER — Compact top bar
          ════════════════════════════════════════ */}
      <div className="home-header fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm py-1">
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 leading-none">MEDONEX</span>
          <p className="text-sm mt-0.5 leading-tight">
            <span className="font-medium text-foreground/80">Hello</span>
            <span className="font-black text-foreground"> {data.firstName} 👋</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {data.currentStreak > 0 && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-[9px] font-black text-orange-500 tabular-nums leading-none">{data.currentStreak}d</span>
            </div>
          )}

          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex items-center justify-center w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-full bg-card/60 ring-1 ring-border/30 text-muted-foreground hover:text-primary transition-all duration-200 shrink-0"
          >
            <Bell className="h-3.5 w-3.5" />
            {unread > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-full bg-card/60 ring-1 ring-border/30 text-muted-foreground hover:text-primary transition-all duration-200 shrink-0"
          >
            {mounted && theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => router.push("/profile/edit")}
            className="shrink-0"
          >
            {data.userImage ? (
              <img
                src={data.userImage}
                alt={data.firstName}
                className="w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-full object-cover ring-2 ring-border/20"
              />
            ) : (
              <div className="w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-border/20">
                <span className="text-xs font-black text-foreground/50">{avatarLetter}</span>
              </div>
            )}
          </button>
        </div>
      </div>
      <div className="h-16" /> {/* spacer for fixed header */}

      {/* ════════════════════════════════════════
          ACHIEVEMENT RINGS — Progress indicators
          ════════════════════════════════════════ */}
      {(() => {
        const streakData = computeStreakProgress(data.currentStreak);
        const rings = [
          { pct: data.dailyPct, icon: Target, value: `${data.todayItemCount}/${data.dailyTarget}`, sublabel: "Daily", color: "#2563EB", bgColor: "rgba(37,99,235,0.15)" },
          { pct: data.progressToNext, icon: Trophy, value: `${data.progressToNext}%`, sublabel: "Rank", color: "#D97706", bgColor: "rgba(217,119,6,0.15)" },
          { pct: data.overallPct, icon: Sparkles, value: `${data.overallPct}%`, sublabel: "Mastery", color: "#06B6D4", bgColor: "rgba(6,182,212,0.15)" },
          { pct: streakData.pct, icon: Flame, value: streakData.label, sublabel: "Streak", color: "#F97316", bgColor: "rgba(249,115,22,0.15)" },
        ];
        return (
          <div className="px-5 mb-6">
            <div className="flex items-center justify-between bg-card/30 rounded-2xl px-4 py-3 border border-border/10">
              {rings.map((ring) => (
                <ProgressRing key={ring.sublabel} {...ring} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════
          HERO — Compact Continue Lecture card
          ════════════════════════════════════════ */}
      <div className="px-5 mb-8">
        <CompactFocusCard lastLecture={data.lastLecture ?? null} firstName={data.firstName} />
      </div>

      {/* ════════════════════════════════════════
          FEATURED — Premium AI recommendation card
          ════════════════════════════════════════ */}
      {recommendations.length > 0 && (
        <div
          className="px-5 mb-8"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <FeaturedCard
            rec={recommendations[featuredIndex]}
            index={featuredIndex}
            total={recommendations.length}
            activeIndex={featuredIndex}
            onSwipe={handleFeaturedSwipe}
          />
        </div>
      )}

      {/* ════════════════════════════════════════
          MODULES — Horizontal peek cards
          ════════════════════════════════════════ */}
      {moduleProgress.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between px-5 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Modules</span>
            <Link href="/modules" className="text-[9px] font-bold text-primary hover:text-primary/80 transition-colors">
              See all <ChevronRight className="h-2.5 w-2.5 inline" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto home-no-scrollbar px-5 pr-6">
            {moduleProgress.slice(0, 6).map((mod) => (
              <Link
                key={mod.id}
                href={`/modules/${mod.id}`}
                className="home-module-card shrink-0"
              >
                <div className="h-[80px] w-full rounded-t-[20px] overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
                  {mod.imageUrl ? (
                    <img src={mod.imageUrl} alt={mod.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-7 w-7 text-muted-foreground/25" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-bold text-foreground truncate leading-tight">{mod.name}</p>
                  <div className="h-1 bg-muted/40 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${mod.pct}%` }} />
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground/50 mt-1 tabular-nums">{mod.pct}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TODAY'S QUEUE
          ════════════════════════════════════════ */}
      <div className="px-5 mb-8">
        <TodayQueue tasks={todayTasks} />
      </div>

      {/* ════════════════════════════════════════
          COMMUNITY — Compact horizontal cards
          ════════════════════════════════════════ */}
      <div className="mb-8">
        <CommunityPostsCarousel variant="compact" maxPosts={5} />
      </div>

      {/* ════════════════════════════════════════
          QUICK ACTIONS
          ════════════════════════════════════════ */}
      <div className="px-5 mb-8">
        <QuickActionsStrip />
      </div>

      {/* ════════════════════════════════════════
          WEEKLY ACTIVITY
          ════════════════════════════════════════ */}
      <div className="px-5 mb-8">
        <LearningHeatmap data={data} />
      </div>

      {/* ════════════════════════════════════════
          Notifications Sheet
          ════════════════════════════════════════ */}
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
