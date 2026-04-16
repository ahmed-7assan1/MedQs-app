import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectIncompleteStudentToRegister } from "@/lib/student-onboarding";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Trophy,
  TrendingUp,
  ChevronRight,
  Zap,
  Clock,
  BarChart3,
  Flame,
  Target,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { getUserRankInfo } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { DashboardDrQFab } from "@/components/dashboard/DashboardDrQFab";
import { MedqsCard } from "@/components/ui/MedqsCard";
import {
  bucketItemsByLocalDay,
  computeStreak,
  last7DayKeys,
  localYmd,
  startOfLocalDay,
} from "@/lib/dashboard-stats";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await redirectIncompleteStudentToRegister(session);

  const userId = session.user.id;
  const dayStart = startOfLocalDay();
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  let user: any = null;
  let rankInfo: any = null;
  let recentAttempts: any[] = [];
  let weekItems: Array<{ attempt: { createdAt: Date } }> = [];
  let todayItemCount = 0;
  let recentAttemptsForStreak: Array<{ createdAt: Date }> = [];
  let quickPaperResolved: { id: string; title: string } | null = null;
  let modules: any[] = [];
  let attemptItems: any[] = [];
  let lastLectureActivity: any = null;

  try {
    [user, rankInfo, recentAttempts, weekItems, todayItemCount, recentAttemptsForStreak] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            semesterId: true,
            university: { select: { name: true } },
            semester: { select: { name: true } },
          },
        }),
        getUserRankInfo(userId),
        prisma.quizAttempt.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true,
            score: true,
            createdAt: true,
            pastPaper: { select: { title: true } },
          },
        }),
        prisma.quizAttemptItem.findMany({
          where: { attempt: { userId, createdAt: { gte: weekStart } } },
          select: { attempt: { select: { createdAt: true } } },
        }),
        prisma.quizAttemptItem.count({
          where: { attempt: { userId, createdAt: { gte: dayStart } } },
        }),
        prisma.quizAttempt.findMany({
          where: { userId },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 400,
        }),
      ]);

    quickPaperResolved =
      user?.semesterId != null
        ? await prisma.pastPaper.findFirst({
            where: { semesterId: user.semesterId },
            orderBy: { title: "asc" },
            select: { id: true, title: true },
          })
        : null;

    [modules, attemptItems, lastLectureActivity] = await Promise.all([
      user?.semesterId != null
        ? prisma.module.findMany({
            where: { semesterId: user.semesterId },
            orderBy: { name: "asc" },
            include: {
              subjects: {
                include: {
                  lectures: {
                    include: {
                      _count: { select: { questions: true } },
                      questions: { select: { id: true } },
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
      prisma.quizAttemptItem.findMany({
        where: {
          attempt: { userId },
          isCorrect: true,
        },
        select: {
          questionId: true,
          question: {
            select: {
              lectureId: true,
              lecture: {
                select: {
                  subject: { select: { moduleId: true } },
                },
              },
            },
          },
        },
      }),
      prisma.userLectureActivity.findFirst({
        where: { userId },
        orderBy: { lastViewedAt: "desc" },
        select: {
          lastViewedAt: true,
          lecture: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  moduleId: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);
  } catch (err) {
    console.warn("[dashboard-app] DB unavailable, rendering fallback dashboard:", err instanceof Error ? err.message : err);
  }

  const correctByModule: Record<string, Set<string>> = {};
  for (const item of attemptItems) {
    const moduleId = item.question.lecture.subject.moduleId;
    if (!correctByModule[moduleId]) correctByModule[moduleId] = new Set();
    correctByModule[moduleId].add(item.questionId);
  }

  const moduleProgress = modules.map((mod) => {
    const allQuestions = mod.subjects.flatMap((s: any) => s.lectures).flatMap((l: any) => l.questions);
    const total = allQuestions.length;
    const correct = correctByModule[mod.id]?.size ?? 0;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const lectures = mod.subjects.reduce((a: number, s: any) => a + s.lectures.length, 0);
    return { id: mod.id, name: mod.name, total, correct, pct, lectures };
  });

  const totalQuestions = moduleProgress.reduce((a, m) => a + m.total, 0);
  const totalCorrect = moduleProgress.reduce((a, m) => a + m.correct, 0);
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const activeDays = new Set<string>();
  for (const a of recentAttemptsForStreak) {
    activeDays.add(localYmd(a.createdAt));
  }
  const streak = computeStreak(activeDays);

  const chartDays = last7DayKeys();
  const weekCounts = bucketItemsByLocalDay(
    weekItems.map((i) => i.attempt.createdAt),
    chartDays.map((d) => d.key)
  );
  const weekMax = Math.max(1, ...weekCounts);

  const recommended = [...moduleProgress]
    .filter((m) => m.total > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const dashSubtitle =
    user?.university != null
      ? [user.university.name, user?.semester?.name].filter(Boolean).join(" · ")
      : "Track modules, papers, and community activity in one clinical-grade workspace.";

  return (
    <StudentPageShell maxWidthClass="max-w-7xl">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-600 p-8 text-white shadow-2xl flex items-center justify-between">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-900/30 blur-2xl" />
        
        <div className="relative z-10 max-w-2xl">
          <p className="mb-2 text-sm font-semibold tracking-wide text-sky-100 uppercase">{greeting}</p>
          <h1 className="mb-3 font-display text-4xl font-bold tracking-tight md:text-5xl drop-shadow-sm">
            Welcome back, <span className="bg-gradient-to-r from-sky-100 to-white bg-clip-text text-transparent">{user?.name?.split(" ")[0] ?? "Student"}</span>
          </h1>
          <p className="text-sm leading-relaxed text-sky-100/90 md:text-base">
            {dashSubtitle}
          </p>
        </div>
        <div className="hidden lg:flex relative z-10 pr-8">
          <Sparkles className="h-24 w-24 animate-pulse text-sky-200/50 mix-blend-screen" strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

        {/* Study Streak — Orange */}
        <div className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-card p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-orange-500/40 dark:bg-slate-900 lg:p-7"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, transparent 70%)", borderLeft: "4px solid #f97316" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:text-xs">Study Streak</p>
              <p className="mt-1.5 font-display text-3xl font-bold tabular-nums md:text-4xl lg:text-5xl">{streak}d</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground/80 lg:text-sm">{streak > 0 ? "Keep it going 🔥" : "Start today"}</p>
            </div>
            <div className="rounded-xl bg-orange-500/10 p-2.5 lg:rounded-2xl lg:p-4">
              <Flame className={cn("h-6 w-6 text-orange-500 lg:h-8 lg:w-8", streak > 0 && "animate-[flicker_1.5s_ease-in-out_infinite]")} />
            </div>
          </div>
        </div>

        {/* Questions Today — Teal */}
        <div className="group relative overflow-hidden rounded-2xl border border-teal-500/20 bg-card p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-teal-500/40 dark:bg-slate-900 lg:p-7"
          style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, transparent 70%)", borderLeft: "4px solid #06b6d4" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:text-xs">Questions Today</p>
              <p className="mt-1.5 font-display text-3xl font-bold tabular-nums md:text-4xl lg:text-5xl">{todayItemCount}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground/80 lg:text-sm">Items in sessions</p>
            </div>
            <div className="rounded-xl bg-teal-500/10 p-2.5 lg:rounded-2xl lg:p-4">
              <Target className="h-6 w-6 text-teal-500 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        {/* Mastery — Purple */}
        <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-card p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-purple-500/40 dark:bg-slate-900 lg:p-7"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, transparent 70%)", borderLeft: "4px solid #8b5cf6" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:text-xs">Mastery</p>
              <p className="mt-1.5 font-display text-3xl font-bold tabular-nums md:text-4xl lg:text-5xl">{overallPct}%</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground/80 lg:text-sm">{totalCorrect}/{totalQuestions} correct</p>
            </div>
            {/* Circular progress ring */}
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center lg:h-16 lg:w-16">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-purple-500/20" strokeWidth="3.5" fill="none" d="M18 2a16 16 0 110 32 16 16 0 110-32" />
                <path className="stroke-purple-500 transition-all duration-1000 ease-out" strokeWidth="3.5" fill="none"
                  strokeDasharray={`${overallPct}, 100`} strokeLinecap="round"
                  d="M18 2a16 16 0 110 32 16 16 0 110-32" />
              </svg>
              <TrendingUp className="absolute h-4 w-4 text-purple-500 lg:h-5 lg:w-5" />
            </div>
          </div>
        </div>

        {/* Your Points — Gold */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-amber-500/40 dark:bg-slate-900 lg:p-7"
          style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.06) 0%, transparent 70%)", borderLeft: "4px solid #eab308" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:text-xs">Your Points</p>
              <p className="mt-1.5 font-display text-3xl font-bold tabular-nums md:text-4xl lg:text-5xl">{rankInfo?.points ?? 0}</p>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 lg:text-xs">
                {rankInfo?.rank?.label ?? "Newbie"}
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-2.5 animate-[bounce_2s_ease-in-out_1] lg:rounded-2xl lg:p-4">
              <Trophy className="h-6 w-6 text-amber-500 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

      </div>


      {/* CSS keyframes for card animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flicker { 0%,100%{opacity:1;transform:scale(1)} 25%{opacity:.85;transform:scale(1.08) rotate(-3deg)} 75%{opacity:.9;transform:scale(1.05) rotate(3deg)} }
      ` }} />


      {lastLectureActivity?.lecture?.subject?.moduleId ? (
        <div className="mb-8 overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 to-transparent p-6 dark:border-sky-500/30 dark:from-sky-900/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Continue where you left off</p>
              <p className="mt-1 truncate font-display text-xl font-bold text-foreground drop-shadow-sm">
                {lastLectureActivity.lecture.title}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{lastLectureActivity.lecture.subject.name}</p>
            </div>
            <Link
              href={`/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-transform hover:scale-105 active:scale-95"
            >
              Resume lecture
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Weekly activity */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-sky-500" aria-hidden />
                <h2 className="font-display text-xl font-bold tracking-tight">Weekly activity</h2>
              </div>
              <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">Qs per day</span>
            </div>
            <div className="relative flex h-56 items-end justify-between gap-2 px-1 pb-2 pt-6 sm:gap-4" role="img" aria-label="Weekly questions chart">
              {/* Subtle Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-6 opacity-30 pointer-events-none">
                <div className="w-full border-t border-dashed border-border/60" />
                <div className="w-full border-t border-dashed border-border/60" />
                <div className="w-full border-t border-dashed border-border/60" />
                <div className="w-full border-t border-dashed border-border/60" />
              </div>

              {chartDays.map((d, i) => {
                const h = Math.round((weekCounts[i] / weekMax) * 100);
                return (
                  <div key={d.key} className="group relative z-10 flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="absolute -top-7 text-xs font-bold text-sky-600 transition-all dark:text-sky-400">
                      {weekCounts[i] > 0 ? weekCounts[i] : ""}
                    </span>
                    <div
                      className="w-full max-w-[3rem] rounded-t-lg bg-gradient-to-t from-sky-500/10 to-sky-500/90 shadow-[0_4px_20px_rgba(14,165,233,0.15)] transition-all group-hover:to-indigo-500 dark:to-sky-400/80"
                      style={{ height: `${Math.max(h, weekCounts[i] > 0 ? 12 : 4)}%` }}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground sm:text-xs">{d.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module progress */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-500" aria-hidden />
                <h2 className="font-display text-xl font-bold tracking-tight">Module progress</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1">
                 <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{overallPct}% overall</span>
              </div>
            </div>

            {moduleProgress.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <BookOpen className="mb-2 h-8 w-8 opacity-30" aria-hidden />
                <p className="text-sm font-medium">No modules yet</p>
                <p className="text-xs opacity-80">Content will appear once added by your admin.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {moduleProgress.map((mod) => (
                  <Link
                    key={mod.id}
                    href="/modules"
                    className="group block rounded-xl border border-transparent p-3 -mx-3 transition-colors hover:border-border/50 hover:bg-muted/30 focus-visible:outline-none"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-bold">{mod.name}</span>
                        <span className="mt-0.5 text-[11px] font-medium text-muted-foreground/80">
                          {mod.lectures} lectures · {mod.total} questions
                        </span>
                      </div>
                      <div className="ml-2 flex flex-shrink-0 items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground">
                          {mod.correct} / {mod.total}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 shadow-inner dark:bg-slate-800">
                          <span className="text-[10px] font-bold text-foreground">{mod.pct}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-muted/60 shadow-inner">
                      <div
                        className={cn(
                          "relative h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-center overflow-hidden",
                          mod.pct >= 70
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : mod.pct >= 40
                              ? "bg-gradient-to-r from-amber-500 to-orange-400"
                              : mod.pct > 0
                                ? "bg-gradient-to-r from-sky-500 to-indigo-500"
                                : "bg-muted-foreground/20"
                        )}
                        style={{ width: `${mod.pct}%` }}
                      >
                         <div className="absolute inset-0 -translate-x-full animate-[pulse_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recommended */}
          {recommended.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <h2 className="mb-1 font-display text-xl font-bold tracking-tight">Recommended next</h2>
              <p className="mb-5 text-sm font-medium text-muted-foreground">
                Modules with room to grow — prioritize these for balanced prep.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {recommended.map((m, i) => {
                  const Icon = i === 0 ? Flame : i === 1 ? Zap : Sparkles;
                  const iconTone = i === 0 ? "text-orange-500" : i === 1 ? "text-amber-500" : "text-emerald-500";
                  return (
                    <Link
                      key={m.id}
                      href="/modules"
                      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-4 transition-all hover:border-sky-500/40 hover:bg-sky-500/5 hover:shadow-lg dark:hover:bg-slate-800/50"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className={cn("rounded-xl bg-background p-2.5 shadow-sm", iconTone)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                      <p className="font-display text-sm font-bold leading-snug drop-shadow-sm">{m.name}</p>
                      <p className="mt-1.5 text-xs font-semibold text-muted-foreground">{m.pct}% complete</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/60">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${m.pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="group relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-transparent p-6 transition-colors hover:border-sky-500/40 dark:border-white/10 dark:bg-slate-900">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative z-10 flex items-center gap-3">
              <span className="text-3xl animate-pulse">🧠</span>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground drop-shadow-sm">Dr. Q Coach</h2>
            </div>
            <p className="relative z-10 mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
              Explain vignettes, simplify concepts, mnemonics, and test ideas — expertly tuned for clinical mastery.
            </p>
            <Link
              href="/ai-chat"
              className="relative z-10 mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-sky-500/20 transition-transform active:scale-95"
            >
              Open AI assistant
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl" />
            <h2 className="relative z-10 mb-1 font-display text-lg font-bold tracking-tight">Daily Target</h2>
            <div className="relative z-10 mt-4 flex items-center justify-between">
              <div>
                <p className="text-3xl font-display font-bold text-sky-500 drop-shadow-sm">
                  {todayItemCount} <span className="text-sm font-semibold text-muted-foreground">/ 20</span>
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">questions today</p>
              </div>
              <div className="relative flex h-16 w-16 items-center justify-center drop-shadow-md">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path className="stroke-muted/30 dark:stroke-muted/10 stroke-current drop-shadow-sm" strokeWidth="4" fill="none" d="M18 2a16 16 0 110 32 16 16 0 110-32" />
                  <path className="stroke-sky-500 stroke-current transition-all duration-1000 ease-out" strokeDasharray={`${Math.min(todayItemCount / 20 * 100, 100)}, 100`} strokeLinecap="round" strokeWidth="4" fill="none" d="M18 2a16 16 0 110 32 16 16 0 110-32" />
                </svg>
                <Target className="absolute h-5 w-5 text-sky-500" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold tracking-tight">Your rank</h2>
              <Trophy className="h-5 w-5 text-amber-500 drop-shadow" aria-hidden />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted/40 shadow-inner">
                <svg className="absolute inset-0 h-full w-full -rotate-90 transform drop-shadow-md" viewBox="0 0 36 36">
                  <path className="stroke-muted/30 dark:stroke-muted/10 stroke-current" strokeWidth="3" fill="none" d="M18 2a16 16 0 110 32 16 16 0 110-32" />
                  <path className="stroke-amber-500 stroke-current transition-all duration-1000 ease-out" strokeDasharray={`${rankInfo?.progress ?? 0}, 100`} strokeLinecap="round" strokeWidth="3" fill="none" d="M18 2a16 16 0 110 32 16 16 0 110-32" />
                </svg>
                <span className="relative z-10 text-3xl drop-shadow-sm">{rankInfo?.rank?.badge ?? "🎓"}</span>
              </div>
              <div className="flex-1">
                <p className="font-display text-xl font-bold leading-tight text-foreground drop-shadow-sm">{rankInfo?.rank?.label ?? "Newbie"}</p>
                <p className="mt-1 text-sm font-bold text-sky-600 dark:text-sky-400">{rankInfo?.points ?? 0} pts</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                  {rankInfo?.nextRank ? `${rankInfo.nextRank.minPoints - (rankInfo.points ?? 0)} to next` : 'Max rank!'}
                </p>
              </div>
            </div>
          </div>

          {quickPaperResolved && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-sky-500/30 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle className="h-5 w-5 text-sky-500" aria-hidden />
                <h2 className="font-display text-lg font-bold tracking-tight">Quick start quiz</h2>
              </div>
              <p className="line-clamp-2 text-sm font-medium text-muted-foreground leading-relaxed">{quickPaperResolved.title}</p>
              <Link
                href={`/quiz/${quickPaperResolved.id}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-600 transition hover:bg-sky-500/20 active:scale-95 dark:text-sky-400"
              >
                Start now
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h2 className="mb-4 font-display text-lg font-bold tracking-tight">Shortcuts</h2>
            <div className="space-y-1.5">
              {[
                { href: "/modules", label: "Browse modules", icon: BookOpen },
                { href: "/past-papers", label: "Practice papers", icon: FileText },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-muted/80 focus-visible:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              ))}
            </div>
          </div>

          {recentAttempts.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <h2 className="mb-4 font-display text-lg font-bold tracking-tight">Recent attempts</h2>
              <ul className="space-y-3">
                {recentAttempts.map((attempt) => (
                  <li key={attempt.id}>
                    <Link
                      href={`/quiz/attempt/${attempt.id}`}
                      className="group flex items-center justify-between rounded-xl p-2 -mx-2 transition-colors hover:bg-muted/60 focus-visible:outline-none"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="truncate text-sm font-bold transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">{attempt.pastPaper.title}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm",
                          attempt.score >= 70
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : attempt.score >= 50
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {attempt.score}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <DashboardDrQFab />
    </StudentPageShell>
  );
}
