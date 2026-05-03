import { auth } from "@/lib/auth";
import { redirectIncompleteStudentToRegister } from "@/lib/student-onboarding";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Sparkles, BookOpen, Target, Trophy, Flame,
  Brain, Zap, TrendingUp, ArrowRight, BarChart2, Clock,
  CheckCircle, Star, GraduationCap, Activity,
} from "lucide-react";
import { getUserRankInfo } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { fetchDashboardData } from "@/lib/dashboard-queries";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await redirectIncompleteStudentToRegister(session);

  const userId = session.user.id;
  const chartDays = last7DayKeys();
  const chartDayKeyStrings = chartDays.map((d) => d.key);

  let dashData: Awaited<ReturnType<typeof fetchDashboardData>> | null = null;
  let rankInfo: Awaited<ReturnType<typeof getUserRankInfo>> | null = null;

  try {
    [dashData, rankInfo] = await Promise.all([
      fetchDashboardData(userId, chartDayKeyStrings),
      getUserRankInfo(userId),
    ]);
  } catch (err) {
    console.warn("[dashboard-app] DB error:", err instanceof Error ? err.message : err);
  }

  const { stats, moduleProgress, lastLectureActivity } = (dashData as any) || {
    stats: { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 },
    moduleProgress: [],
    lastLectureActivity: null,
  };

  const safeStats = stats || { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 };
  const { totalQuestions, totalCorrect, todayItemCount, currentStreak } = safeStats;
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const dailyTarget = 50;
  const dailyPct = Math.min(100, Math.round((todayItemCount / dailyTarget) * 100));
  const firstName = session.user.name?.split(" ")[0] || "Student";

  const { label: rankLabel, totalPoints: rankPoints } = (rankInfo as any) || {
    label: "Med Student",
    totalPoints: 0,
  };

  const activityArr = (dashData as any)?.activity || [];
  const maxCount = Math.max(...activityArr.map((a: any) => a.count), 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 md:px-8">

        {/* ══════════════ HERO GREETING ══════════════ */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8 shadow-sm">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/8 blur-2xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <h1 className="font-display text-4xl font-black tracking-tight text-foreground md:text-5xl">
                Welcome back, <span className="text-primary">{firstName}</span>.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {overallPct > 0
                  ? `You've mastered ${overallPct}% of your curriculum. Keep going! 🔥`
                  : "Ready to master your clinical concepts today?"}
              </p>
            </div>

            {/* Streak + Rank */}
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 backdrop-blur-sm shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                  <Flame className={cn("h-5 w-5", currentStreak > 0 ? "text-orange-500" : "text-muted-foreground/40")} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Streak</p>
                  <p className="text-lg font-black text-foreground">{currentStreak} <span className="text-sm font-bold text-muted-foreground">days</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 backdrop-blur-sm shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{rankLabel}</p>
                  <p className="text-lg font-black text-foreground">{(rankPoints || 0).toLocaleString()} <span className="text-sm font-bold text-muted-foreground">pts</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════ STATS ROW ══════════════ */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Daily Goal"
            value={`${dailyPct}%`}
            sub={`${todayItemCount} / ${dailyTarget} questions`}
            icon={Target}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
            progress={dailyPct}
            progressColor="from-blue-500 to-sky-400"
          />
          <StatCard
            label="Overall Mastery"
            value={`${overallPct}%`}
            sub={`${totalCorrect} correct answers`}
            icon={Brain}
            iconColor="text-violet-500"
            iconBg="bg-violet-500/10"
            progress={overallPct}
            progressColor="from-violet-500 to-purple-400"
          />
          <StatCard
            label="Questions Done"
            value={totalQuestions.toLocaleString()}
            sub="total practice items"
            icon={CheckCircle}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
            progress={null}
          />
          <StatCard
            label="Modules"
            value={moduleProgress.length}
            sub="active this semester"
            icon={GraduationCap}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/10"
            progress={null}
          />
        </div>

        {/* ══════════════ MAIN GRID ══════════════ */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">

            {/* Continue Learning */}
            {lastLectureActivity && (
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Resume Learning</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold text-primary ring-1 ring-primary/20">
                      Continue where you left off
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                        <BookOpen className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-card-foreground capitalize">
                          {lastLectureActivity.lecture.title}
                        </h3>
                        <p className="text-xs font-bold text-muted-foreground">
                          {lastLectureActivity.lecture.subject.name}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}`}
                      className="btn-gradient flex shrink-0 items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                    >
                      Continue <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Module Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-1 rounded-full bg-primary" />
                  <h2 className="font-display text-xl font-black text-foreground">Module Progress</h2>
                </div>
                <Link href="/modules" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline underline-offset-4">
                  See all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(moduleProgress.slice(0, 4) as any[]).map((mod: any) => (
                  <Link
                    key={mod.id}
                    href="/modules"
                    className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors">
                        {mod.name}
                      </span>
                      <span className={cn(
                        "text-xs font-black",
                        mod.pct >= 70 ? "text-emerald-500" :
                        mod.pct > 0   ? "text-amber-500"   : "text-muted-foreground"
                      )}>
                        {mod.pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          mod.pct >= 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                          mod.pct > 0   ? "bg-gradient-to-r from-amber-500 to-orange-400" :
                                          "bg-primary"
                        )}
                        style={{ width: `${Math.max(mod.pct, 2)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {mod.pct > 0 ? `${mod.pct}% Complete` : "Not started"}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {[
                { href: "/modules",     label: "Lectures",     icon: BookOpen,   color: "text-sky-500",     bg: "bg-sky-500/10"     },
                { href: "/past-papers", label: "Quizzes",      icon: Zap,        color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { href: "/forum",       label: "Community",    icon: Activity,   color: "text-violet-500",  bg: "bg-violet-500/10"  },
                { href: "/ai-chat",     label: "Ask Dr. Q",    icon: Sparkles,   color: "text-primary",     bg: "bg-primary/10"     },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-md"
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110", item.bg)}>
                    <item.icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">

            {/* Weekly Activity Chart */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Weekly Activity</p>
                  <p className="mt-0.5 text-xl font-black text-foreground">
                    {activityArr.reduce((a: number, b: any) => a + b.count, 0)} <span className="text-sm font-bold text-muted-foreground">this week</span>
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart2 className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="flex h-28 items-end justify-between gap-2 px-1">
                {chartDays.map((d, i) => {
                  const dayData = activityArr.find((x: any) => x.day === d.key);
                  const val = dayData?.count || 0;
                  const h = maxCount > 0 ? (val / maxCount) * 100 : 0;
                  const isToday = i === chartDays.length - 1;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div className="relative w-full flex-1 overflow-hidden rounded-t-lg bg-muted">
                        <div
                          className={cn(
                            "absolute bottom-0 w-full rounded-t-lg transition-all duration-1000",
                            isToday ? "bg-gradient-to-t from-primary to-violet-400" : "bg-primary/40"
                          )}
                          style={{ height: `${Math.max(h, val > 0 ? 8 : 2)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>{d.shortLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dr. Q Promo */}
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-violet-500/10 p-6">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-16 w-16 rounded-full bg-violet-500/10 blur-xl" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">AI Powered</p>
                    <h4 className="text-sm font-black text-foreground">Ask Dr. Q</h4>
                  </div>
                </div>
                <p className="mb-5 text-[12px] leading-relaxed text-muted-foreground">
                  Have a clinical question? Get instant AI-powered explanations tailored to your curriculum.
                </p>
                <Link
                  href="/ai-chat"
                  className="btn-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-lg shadow-primary/25"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Start Chatting
                </Link>
              </div>
            </div>

            {/* Rank card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Rank</p>
                  <p className="text-lg font-black text-foreground">{rankLabel}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
                <span>{(rankPoints || 0).toLocaleString()} pts</span>
                <span>Next level</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
                  style={{ width: `${Math.min(((rankInfo as any)?.progressToNext || 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, progress, progressColor }: {
  label: string; value: string | number; sub: string;
  icon: any; iconColor: string; iconBg: string;
  progress: number | null; progressColor?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/10">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/3 blur-2xl" />
      <div className="relative">
        <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{sub}</p>
        {progress !== null && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", progressColor)}
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
