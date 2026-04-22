import { auth } from "@/lib/auth";
import { redirectIncompleteStudentToRegister } from "@/lib/student-onboarding";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, BookOpen, FileText } from "lucide-react";
import { getUserRankInfo } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { HomeTopBar } from "@/components/dashboard/HomeTopBar";
import { DashboardDrQFab } from "@/components/dashboard/DashboardDrQFab";
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

  const {
    user,
    recentAttempts = [],
    todayItemCount = 0,
    streak = 0,
    weekCounts = chartDays.map(() => 0),
    moduleProgress = [],
    totalQuestions = 0,
    totalCorrect = 0,
    quickPaper = null,
    lastLectureActivity = null,
  } = dashData ?? {};

  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const weekMax = Math.max(1, ...weekCounts);
  const dailyPct = Math.min(Math.round((todayItemCount / 20) * 100), 100);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const location = [user?.university?.name, user?.semester?.name].filter(Boolean).join(" · ") || "MedQs Platform";

  const rankLabel = rankInfo?.rank?.label ?? "Newbie";
  const rankBadge = rankInfo?.rank?.badge ?? "🎓";
  const rankProgress = rankInfo?.progress ?? 0;
  const rankPoints = rankInfo?.points ?? 0;
  const nextRankHint = rankInfo?.nextRank
    ? `${(rankInfo.nextRank.minPoints - rankPoints).toLocaleString()} pts to next rank`
    : "Max rank!";

  const recommended = [...moduleProgress]
    .filter((m) => m.total > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4);

  return (
    <StudentPageShell maxWidthClass="max-w-[1400px]" className="pt-0 lg:pt-10" noTopPaddingMobile>
      
      {/* ── Premium Mobile Top Bar (Home Only) ── */}
      <HomeTopBar 
        userName={user?.name ?? "Student"} 
        userImage={user?.image ?? undefined}
        location={location}
        modules={moduleProgress.map(m => ({ id: m.id, name: m.name }))}
      />

      {/* ── Desktop Greeting Banner (Hidden on mobile via HomeTopBar presence) ── */}
      <div
        className="mb-5 hidden lg:flex items-center justify-between overflow-hidden rounded-xl px-6 py-5"
        style={{ background: "linear-gradient(130deg, #534AB7 0%, #7C3AED 60%, #6D28D9 100%)" }}
      >
        <div>
          <p className="text-xs font-medium text-purple-200/80 mb-0.5">{greeting}</p>
          <h1 className="text-xl font-bold text-white leading-tight">{firstName}</h1>
          <p className="text-xs text-purple-200/70 mt-0.5">{location}</p>
        </div>
        <div className="hidden sm:block text-4xl opacity-40 select-none">🩺</div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Study Streak" value={`${streak}d`} sub={streak > 0 ? "Keep it up 🔥" : "Start today"} accent="#f97316" />
        <StatCard label="Questions Today" value={todayItemCount} sub="items answered" accent="#06b6d4" />
        <StatCard label="Mastery" value={`${overallPct}%`} sub={`${totalCorrect}/${totalQuestions} correct`} accent="#8b5cf6" />
        <StatCard
          label="Your Points"
          value={rankPoints.toLocaleString()}
          sub={rankLabel}
          accent="#eab308"
          badge={rankLabel}
        />
      </div>

      {/* ── Continue Card ── */}
      {lastLectureActivity?.lecture?.subject?.moduleId && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-5 py-5 shadow-xl">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#534AB7] dark:text-purple-400 mb-0.5">
              Continue where you left off
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {lastLectureActivity.lecture.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastLectureActivity.lecture.subject.name}
            </p>
          </div>
          <Link
            href={`/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}`}
            className="shrink-0 rounded-lg bg-[#534AB7] px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 active:scale-95 min-h-[44px] flex items-center gap-1.5"
          >
            Resume <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── Main 70/30 Grid ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">

        {/* ── LEFT: Main Content ── */}
        <div className="space-y-4">

          {/* Weekly Activity + Module Progress side by side */}
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Weekly Activity */}
            <div className="rounded-xl border border-white/[0.02] bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Weekly Activity</p>
              <div className="flex items-end gap-1.5 h-28">
                {chartDays.map((d, i) => {
                  const pct = weekMax > 0 ? Math.round((weekCounts[i] / weekMax) * 100) : 0;
                  const isToday = i === chartDays.length - 1;
                  return (
                    <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                      {weekCounts[i] > 0 && (
                        <span className="text-[9px] font-bold text-[#534AB7] dark:text-purple-400">
                          {weekCounts[i]}
                        </span>
                      )}
                      <div className="relative w-full flex-1 flex items-end">
                        <div
                          className={cn(
                            "w-full rounded-t transition-all",
                            isToday
                              ? "bg-[#534AB7]"
                              : weekCounts[i] > 0
                                ? "bg-[#534AB7]/40 dark:bg-purple-400/30"
                                : "bg-muted/40"
                          )}
                          style={{ height: `${Math.max(pct, weekCounts[i] > 0 ? 10 : 4)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-medium text-muted-foreground/70">{d.shortLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Progress */}
            <div className="rounded-xl border border-white/[0.02] bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Module Progress</p>
                <span className="text-xs font-bold text-[#534AB7] dark:text-purple-400">{overallPct}%</span>
              </div>
              {moduleProgress.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 text-center">
                  <p className="text-xs text-muted-foreground">No modules yet</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {moduleProgress.slice(0, 4).map((mod) => (
                    <Link key={mod.id} href="/modules" className="block group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold truncate pr-2 group-hover:text-[#534AB7] dark:group-hover:text-purple-400 transition-colors">
                          {mod.name}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground shrink-0">{mod.pct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${mod.pct}%`,
                              background: mod.pct >= 70
                                ? "#10b981"
                                : mod.pct >= 40
                                  ? "#f59e0b"
                                  : "#534AB7",
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground/60 shrink-0">{mod.total}q</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommended Modules */}
          {recommended.length > 0 && (
            <div className="rounded-xl border border-white/[0.02] bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Focus Next</p>
                <Link href="/modules" className="text-[10px] font-semibold text-[#534AB7] dark:text-purple-400 hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {recommended.map((m) => (
                  <Link
                    key={m.id}
                    href="/modules"
                    className="group rounded-lg border border-white/[0.02] bg-muted/20 p-3 hover:border-[#534AB7]/30 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors"
                  >
                    <p className="text-xs font-semibold leading-snug truncate group-hover:text-[#534AB7] dark:group-hover:text-purple-400 transition-colors">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{m.pct}% done</p>
                    <div className="mt-2 h-0.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#534AB7]"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Start Quiz */}
          {quickPaper && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-5 py-5 shadow-xl">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Quick Start</p>
                <p className="truncate text-sm font-semibold">{quickPaper.title}</p>
              </div>
              <Link
                href={`/quiz/${quickPaper.id}`}
                className="shrink-0 rounded-lg border border-[#534AB7]/30 bg-[#534AB7]/8 px-4 py-2.5 text-xs font-bold text-[#534AB7] dark:text-purple-400 hover:bg-[#534AB7]/15 transition-colors min-h-[44px] flex items-center"
              >
                Start quiz →
              </Link>
            </div>
          )}

          {/* Shortcuts */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/modules", label: "Browse Modules", icon: BookOpen },
              { href: "/past-papers", label: "Practice Papers", icon: FileText },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.02] bg-card px-4 py-3.5 text-sm font-semibold transition-colors hover:border-[#534AB7]/30 hover:bg-purple-50/20 dark:hover:bg-purple-900/10 min-h-[44px]"
              >
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-[#534AB7] transition-colors" />
                <span className="group-hover:text-[#534AB7] dark:group-hover:text-purple-300 transition-colors">{label}</span>
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        {/* On mobile: horizontal scroll row */}
        <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">

          {/* Dr. Q Coach */}
          <div className="min-w-[240px] shrink-0 rounded-xl border border-[#534AB7]/20 bg-purple-50/40 p-4 dark:bg-purple-900/15 dark:border-purple-500/20 lg:min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🧠</span>
              <p className="text-sm font-bold">Dr. Q Coach</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Explain concepts, simplify vignettes, generate mnemonics — tuned for clinical mastery.
            </p>
            <Link
              href="/ai-chat"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#534AB7] px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity active:scale-95 min-h-[44px]"
            >
              Open AI assistant <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Daily Target */}
          <div className="min-w-[200px] shrink-0 rounded-xl border border-white/[0.02] bg-card p-4 lg:min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Daily Target</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-bold tabular-nums">{todayItemCount}</span>
              <span className="text-sm text-muted-foreground font-medium">/ 20</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">questions today</p>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${dailyPct}%`, background: "#534AB7" }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-right">{dailyPct}%</p>
          </div>

          {/* Your Rank */}
          <div className="min-w-[200px] shrink-0 rounded-xl border border-white/[0.02] bg-card p-4 lg:min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Rank</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{rankBadge}</span>
              <div>
                <p className="text-sm font-bold">{rankLabel}</p>
                <p className="text-xs font-semibold text-[#534AB7] dark:text-purple-400">{rankPoints.toLocaleString()} pts</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-700 bg-amber-400"
                style={{ width: `${rankProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{nextRankHint}</p>
          </div>

          {/* Recent Attempts */}
          {recentAttempts.length > 0 && (
            <div className="min-w-[240px] shrink-0 rounded-xl border border-white/[0.02] bg-card p-4 lg:min-w-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent Attempts</p>
                <Link href="/past-papers" className="text-[10px] text-[#534AB7] dark:text-purple-400 hover:underline font-semibold">
                  See all
                </Link>
              </div>
              <ul className="space-y-2.5">
                {recentAttempts.map((attempt) => (
                  <li key={attempt.id}>
                    <Link
                      href={`/quiz/attempt/${attempt.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg p-2 -mx-2 hover:bg-muted/40 transition-colors min-h-[44px]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{attempt.pastPaper.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(attempt.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold",
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

      <DashboardDrQFab isAdmin={(session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUPER_ADMIN"} />
    </StudentPageShell>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent,
  badge,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  badge?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 shadow-xl transition-transform hover:scale-[1.02]"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {/* Soft Inner Glow */}
      <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
      <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: accent }}>
        {value}
      </p>
      {badge ? (
        <span
          className="mt-1.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold"
          style={{ background: `${accent}20`, color: accent }}
        >
          {badge}
        </span>
      ) : (
        <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

