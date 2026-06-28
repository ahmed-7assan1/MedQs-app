import {
  Flame, Trophy, GraduationCap, Star, ShieldCheck, Rocket, Sparkles, BookOpen,
  type LucideIcon,
} from "lucide-react";

export interface BadgeData {
  currentStreak: number;
  totalQuestions: number;
  overallPct: number;
  rankPoints: number;
}

export interface BadgeDef {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  gradient: string;
  glow: string;
  check: (d: BadgeData) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: "legend",
    label: "Legend",
    desc: "90% mastery + 30-day streak",
    icon: Rocket,
    gradient: "from-rose-600 via-pink-500 to-orange-400",
    glow: "shadow-[0_0_12px_rgba(225,29,72,0.4)]",
    check: (d) => d.overallPct >= 90 && d.currentStreak >= 30,
  },
  {
    id: "master",
    label: "Master",
    desc: "85% mastery + 14-day streak",
    icon: Sparkles,
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.35)]",
    check: (d) => d.overallPct >= 85 && d.currentStreak >= 14,
  },
  {
    id: "expert",
    label: "Expert",
    desc: "80% overall mastery",
    icon: ShieldCheck,
    gradient: "from-rose-400 to-red-500",
    glow: "shadow-[0_0_12px_rgba(251,113,133,0.3)]",
    check: (d) => d.overallPct >= 80,
  },
  {
    id: "streak_30",
    label: "Monthly Legend",
    desc: "30 consecutive study days",
    icon: Star,
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    check: (d) => d.currentStreak >= 30,
  },
  {
    id: "centurion",
    label: "Centurion",
    desc: "Answer 500+ questions",
    icon: Trophy,
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-[0_0_12px_rgba(139,92,246,0.3)]",
    check: (d) => d.totalQuestions >= 500,
  },
  {
    id: "streak_7",
    label: "Week Warrior",
    desc: "7 consecutive study days",
    icon: Flame,
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.3)]",
    check: (d) => d.currentStreak >= 7,
  },
  {
    id: "scholar",
    label: "Scholar",
    desc: "Answer 100+ questions",
    icon: GraduationCap,
    gradient: "from-sky-500 to-cyan-500",
    glow: "shadow-[0_0_12px_rgba(14,165,233,0.25)]",
    check: (d) => d.totalQuestions >= 100,
  },
  {
    id: "first_steps",
    label: "First Steps",
    desc: "Complete your first quiz",
    icon: BookOpen,
    gradient: "from-slate-500 to-slate-600",
    glow: "shadow-[0_0_8px_rgba(100,116,139,0.2)]",
    check: () => true,
  },
];

export function getEarnedBadge(data: BadgeData): BadgeDef {
  for (const badge of BADGES) {
    if (badge.check(data)) return badge;
  }
  return BADGES[BADGES.length - 1];
}

export function getBadgeProgress(badgeId: string, data: BadgeData): number {
  switch (badgeId) {
    case "legend": return Math.min(100, Math.round(Math.min(data.currentStreak / 30, data.overallPct / 90) * 100));
    case "master": return Math.min(100, Math.round(Math.min(data.currentStreak / 14, data.overallPct / 85) * 100));
    case "expert": return Math.min(100, Math.round((data.overallPct / 80) * 100));
    case "streak_30": return Math.min(100, Math.round((data.currentStreak / 30) * 100));
    case "centurion": return Math.min(100, Math.round((data.totalQuestions / 500) * 100));
    case "streak_7": return Math.min(100, Math.round((data.currentStreak / 7) * 100));
    case "scholar": return Math.min(100, Math.round((data.totalQuestions / 100) * 100));
    default: return 100;
  }
}

export function getBadgeHint(badgeId: string): string {
  switch (badgeId) {
    case "legend": return "Keep your streak going and push for 90%+ mastery";
    case "master": return "Maintain 85%+ mastery while building a 14-day streak";
    case "expert": return "Focus on accuracy — retry weak areas to reach 80%";
    case "streak_30": return "Study at least one question daily for 30 days";
    case "centurion": return "Complete more quizzes across all subjects";
    case "streak_7": return "Study daily — don't break your streak for 7 days";
    case "scholar": return "Answer more questions to unlock this badge";
    default: return "You've earned this!";
  }
}

export const Q_MILESTONES = [100, 500, 1000, 5000];
