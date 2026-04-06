import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const userId = session.user.id;
  const dayStart = startOfLocalDay();
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const [user, rankInfo, recentAttempts, weekItems, todayItemCount, recentAttemptsForStreak] =
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

  const quickPaperResolved =
    user?.semesterId != null
      ? await prisma.pastPaper.findFirst({
          where: { semesterId: user.semesterId },
          orderBy: { title: "asc" },
          select: { id: true, title: true },
        })
      : null;

  const [modules, attemptItems] = await Promise.all([
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
  ]);

  const correctByModule: Record<string, Set<string>> = {};
  for (const item of attemptItems) {
    const moduleId = item.question.lecture.subject.moduleId;
    if (!correctByModule[moduleId]) correctByModule[moduleId] = new Set();
    correctByModule[moduleId].add(item.questionId);
  }

  const moduleProgress = modules.map((mod) => {
    const allQuestions = mod.subjects.flatMap((s) => s.lectures).flatMap((l) => l.questions);
    const total = allQuestions.length;
    const correct = correctByModule[mod.id]?.size ?? 0;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const lectures = mod.subjects.reduce((a, s) => a + s.lectures.length, 0);
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
    <StudentPageShell maxWidthClass="max-w-7xl" eyebrow={greeting} title={user?.name ?? "Student"} subtitle={dashSubtitle}>
      {/* Hero stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          {
            label: "Study streak",
            value: `${streak}d`,
            sub: streak > 0 ? "Keep it going" : "Start today",
            icon: Flame,
            tone: "text-orange-500",
          },
          {
            label: "Questions today",
            value: todayItemCount,
            sub: "Items in sessions",
            icon: Target,
            tone: "text-teal-600 dark:text-teal-400",
          },
          {
            label: "Mastery",
            value: `${overallPct}%`,
            sub: `${totalCorrect}/${totalQuestions} correct`,
            icon: TrendingUp,
            tone: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Your points",
            value: rankInfo?.points ?? 0,
            sub: rankInfo?.rank?.label ?? "Newbie",
            icon: Trophy,
            tone: "text-amber-500",
          },
        ].map(({ label, value, sub, icon: Icon, tone }) => (
          <MedqsCard key={label} hover className="animate-fade-up">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
              </div>
              <div className={cn("rounded-xl bg-muted/80 p-2.5", tone)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </MedqsCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Weekly activity */}
          <MedqsCard>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="font-display text-lg font-semibold">Weekly activity</h2>
              </div>
              <span className="text-xs text-muted-foreground">Questions attempted per day</span>
            </div>
            <div className="flex h-40 items-end justify-between gap-1.5 sm:gap-2" role="img" aria-label="Bar chart of questions attempted over the last seven days">
              {chartDays.map((d, i) => {
                const h = Math.round((weekCounts[i] / weekMax) * 100);
                return (
                  <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-28 w-full items-end justify-center">
                      <div
                        className="w-full max-w-[2.5rem] rounded-t-lg bg-primary/85 transition-all dark:bg-primary/70"
                        style={{ height: `${Math.max(h, weekCounts[i] > 0 ? 8 : 4)}%` }}
                        title={`${weekCounts[i]} on ${d.key}`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">{d.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          </MedqsCard>

          {/* Module progress */}
          <MedqsCard>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="font-display text-lg font-semibold">Module progress</h2>
              </div>
              <span className="text-sm font-medium text-muted-foreground">{overallPct}% overall</span>
            </div>

            {moduleProgress.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <BookOpen className="mb-2 h-8 w-8 opacity-30" aria-hidden />
                <p className="text-sm">No modules yet</p>
                <p className="text-xs opacity-80">Content will appear once added by your admin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {moduleProgress.map((mod) => (
                  <Link
                    key={mod.id}
                    href="/modules"
                    className="block rounded-xl p-1 -m-1 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{mod.name}</span>
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          {mod.lectures} lec. · {mod.total} Q
                        </span>
                      </div>
                      <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            mod.pct >= 70
                              ? "text-emerald-600 dark:text-emerald-400"
                              : mod.pct >= 40
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                          )}
                        >
                          {mod.correct}/{mod.total}
                        </span>
                        <span className="w-10 text-right text-xs font-bold">{mod.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          mod.pct >= 70
                            ? "bg-emerald-500"
                            : mod.pct >= 40
                              ? "bg-amber-500"
                              : mod.pct > 0
                                ? "bg-primary"
                                : "bg-muted-foreground/20"
                        )}
                        style={{ width: `${mod.pct}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </MedqsCard>

          {/* Recommended */}
          {recommended.length > 0 && (
            <MedqsCard>
              <h2 className="mb-4 font-display text-lg font-semibold">Recommended next</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Modules with room to grow — prioritize these for balanced prep.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {recommended.map((m) => (
                  <Link
                    key={m.id}
                    href="/modules"
                    className="rounded-xl border border-border/80 bg-muted/30 p-4 transition-all hover:border-primary/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="font-display text-sm font-semibold leading-snug">{m.name}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{m.pct}% complete</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${m.pct}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </MedqsCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MedqsCard hover className="border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden />
              <h2 className="font-display text-lg font-semibold text-foreground">Dr. Q — AI study assistant</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Explain vignettes, simplify concepts, mnemonics, and quiz ideas — tuned for medical study.
            </p>
            <Link
              href="/ai-chat"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open assistant
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </MedqsCard>

          {quickPaperResolved && (
            <MedqsCard hover>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="font-display text-lg font-semibold">Quick start quiz</h2>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{quickPaperResolved.title}</p>
              <Link
                href={`/quiz/${quickPaperResolved.id}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Start now
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </MedqsCard>
          )}

          <MedqsCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Your rank</h2>
              <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
            </div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl" aria-hidden>
                {rankInfo?.rank?.badge ?? "🎓"}
              </div>
              <div>
                <p className="font-semibold">{rankInfo?.rank?.label ?? "Newbie"}</p>
                <p className="text-sm text-muted-foreground">{rankInfo?.points ?? 0} points</p>
              </div>
            </div>
            {rankInfo?.nextRank && (
              <>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>To {rankInfo.nextRank.label}</span>
                  <span>{rankInfo.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${rankInfo.progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {rankInfo.nextRank.minPoints - (rankInfo.points ?? 0)} pts to go
                </p>
              </>
            )}
          </MedqsCard>

          <MedqsCard>
            <h2 className="mb-3 font-display text-lg font-semibold">Shortcuts</h2>
            <div className="space-y-1">
              {[
                { href: "/modules", label: "Browse modules", icon: BookOpen },
                { href: "/past-papers", label: "Practice papers", icon: FileText },
                { href: "/forum", label: "Forum", icon: Zap },
                { href: "/space", label: "Study space", icon: Clock },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Link>
              ))}
            </div>
          </MedqsCard>

          {recentAttempts.length > 0 && (
            <MedqsCard>
              <h2 className="mb-3 font-display text-lg font-semibold">Recent attempts</h2>
              <ul className="space-y-3">
                {recentAttempts.map((attempt) => (
                  <li key={attempt.id}>
                    <Link
                      href={`/quiz/attempt/${attempt.id}`}
                      className="flex items-center justify-between rounded-lg px-1 py-1 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{attempt.pastPaper.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ml-2 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          attempt.score >= 70
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
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
            </MedqsCard>
          )}
        </div>
      </div>
      <DashboardDrQFab />
    </StudentPageShell>
  );
}
