import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Lock, BookOpen } from "lucide-react";
import ModulesGrid, { ModuleWithStats } from "@/components/modules/ModulesGrid";
import TopBar from "@/components/modules/TopBar";
import HeroSection from "@/components/modules/HeroSection";
import StatsCard from "@/components/modules/StatsCard";
import QuickActions from "@/components/modules/QuickActions";
import ModuleSection from "@/components/modules/ModuleSection";
import PageContainer from "@/components/modules/PageContainer";
import FeaturedModuleCard from "@/components/modules/FeaturedModuleCard";
import RecentModuleCard from "@/components/modules/RecentModuleCard";
import { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import ModulesContent from "@/components/modules/ModulesContent";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Medical Modules",
  description: "Browse all medical modules for MBBS, USMLE & PLAB preparation. Access lectures, past papers, and study materials organized by module.",
};

function moduleDifficultyLabel(
  questions: { difficulty: string }[]
): { label: string; tone: string; bg: string } | null {
  if (questions.length === 0) return null;
  let e = 0, m = 0, h = 0;
  for (const q of questions) {
    if (q.difficulty === "EASY") e++;
    else if (q.difficulty === "MEDIUM") m++;
    else h++;
  }
  const n = questions.length;
  if (h / n >= 0.35) return { label: "Advanced", tone: "text-red-500 dark:text-red-400", bg: "bg-red-500/10" };
  if ((m + h) / n >= 0.45) return { label: "Mixed", tone: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10" };
  return { label: "Foundational", tone: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10" };
}

async function computeStreak(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ day: string }>>(
    Prisma.sql`
      SELECT DISTINCT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
      FROM "QuizAttempt"
      WHERE "userId" = ${userId}
        AND "createdAt" >= NOW() - INTERVAL '60 days'
      ORDER BY day DESC
    `
  ).catch(() => []);
  if (rows.length === 0) return 0;
  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);
  for (let i = 0; i < 60; i++) {
    const key = cursor.toISOString().slice(0, 10);
    const hasActivity = rows.some((r) => r.day === key);
    if (i === 0 && !hasActivity) { cursor.setDate(cursor.getDate() - 1); continue; }
    if (!hasActivity) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function mapModule(mod: any, correctByModule: Record<string, Set<string>>): ModuleWithStats {
  const lecturesFlat = mod.subjects?.flatMap((s: any) => s.lectures ?? []) ?? [];
  const questionsFlat = lecturesFlat.flatMap((l: any) => l.questions ?? []);
  const allQCount = lecturesFlat.reduce((a: number, l: any) => a + (l._count?.questions ?? 0), 0);
  const corrQ = correctByModule[mod.id]?.size ?? 0;
  const modPct = allQCount > 0 ? Math.round((corrQ / allQCount) * 100) : 0;
  const difficulty = moduleDifficultyLabel(questionsFlat);
  const subjectNames = mod.subjects?.map((s: any) => s.name) ?? [];

  return {
    id: mod.id,
    name: mod.name,
    icon: mod.icon,
    imageUrl: mod.imageUrl,
    subjectsCount: mod.subjects?.length ?? 0,
    lecturesCount: lecturesFlat.length,
    questionsCount: allQCount,
    masteredCount: corrQ,
    percentage: modPct,
    difficulty,
    subjectNames,
  };
}

export default async function ModulesPage() {
  const session = await auth();
  const isGuest = !session?.user?.id;
  const user = session?.user;
  const userId = user?.id;

  let semesterId = (user as any)?.semesterId;
  let universityId = (user as any)?.universityId;
  let role = (user as any)?.role;

  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { semesterId: true, universityId: true, role: true },
    });
    if (dbUser) {
      if (!semesterId) semesterId = dbUser.semesterId;
      if (!universityId) universityId = dbUser.universityId;
      role = dbUser.role || role;
    }
  }
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const currentStreak = userId ? await computeStreak(userId) : 0;

  let semesterInfo: { name: string; academicYear: { yearNumber: number; university: { name: string } } } | null = null;
  let userSemesterYearNum = 0;

  if (semesterId) {
    const sem = await prisma.semester.findUnique({
      where: { id: semesterId },
      select: {
        name: true,
        academicYear: {
          select: { yearNumber: true, university: { select: { name: true } } },
        },
      },
    });
    semesterInfo = sem as any;
    userSemesterYearNum = sem?.academicYear?.yearNumber ?? 0;
  }
  const semesterName = semesterInfo?.name ?? "";
  const universityName = semesterInfo?.academicYear?.university?.name ?? "";

  const correctByModule: Record<string, Set<string>> = {};

  if (userId) {
    const items = await prisma.quizAttemptItem.findMany({
      where: { attempt: { userId }, isCorrect: true },
      select: {
        questionId: true,
        question: {
          select: {
            lecture: {
              select: {
                subject: { select: { moduleId: true } },
              },
            },
          },
        },
      },
    }).catch(() => []);

    for (const item of items) {
      const moduleId = item.question.lecture.subject.moduleId;
      if (!moduleId) continue;
      if (!correctByModule[moduleId]) correctByModule[moduleId] = new Set();
      correctByModule[moduleId].add(item.questionId);
    }
  }

  // ── Fetch all university modules ──────────────────────────────────────────
  const allModules = universityId && semesterId
    ? await prisma.module.findMany({
        where: {
          semester: {
            academicYear: { universityId },
          },
        },
        include: {
          semester: {
            include: {
              academicYear: { select: { yearNumber: true } },
            },
          },
          subjects: {
            include: {
              lectures: {
                select: {
                  _count: { select: { questions: true } },
                  questions: { select: { difficulty: true } },
                },
              },
            },
          },
        },
        orderBy: [
          { semester: { academicYear: { yearNumber: "asc" } } },
          { name: "asc" },
        ],
      }).catch(() => [])
    : [];

  // ── Split into groups ────────────────────────────────────────────────────
  const currentSemModules = allModules.filter((m) => m.semesterId === semesterId);
  const semesterModuleStats = currentSemModules.map((m) => mapModule(m, correctByModule));
  const inProgressStats = semesterModuleStats.filter((m) => m.percentage < 100);
  const completedStats = semesterModuleStats.filter((m) => m.percentage >= 80);

  // ── Group current semester modules for "All Modules" ─────────────────────
  const semesterGroups: { semesterId: string; name: string; yearNumber: number; modules: ModuleWithStats[] }[] = [];
  if (semesterId && currentSemModules.length > 0) {
    const sem = currentSemModules[0].semester;
    semesterGroups.push({
      semesterId,
      name: sem.name,
      yearNumber: sem.academicYear.yearNumber,
      modules: semesterModuleStats,
    });
  }

  // ── Stats for current semester ───────────────────────────────────────────
  const totalModules = inProgressStats.length;
  const completedModulesCount = inProgressStats.filter((m) => m.percentage >= 80).length;
  const totalLectures = inProgressStats.reduce((a, m) => a + m.lecturesCount, 0);
  const totalQuestions = inProgressStats.reduce((a, m) => a + m.questionsCount, 0);
  const totalMasteredCurrent = inProgressStats.reduce((a, m) => a + m.masteredCount, 0);
  const overallPercent =
    totalMasteredCurrent > 0 && totalQuestions > 0
      ? Math.round((totalMasteredCurrent / totalQuestions) * 100)
      : 0;

  // ── Featured (from current semester) ─────────────────────────────────────
  const featured =
    inProgressStats
      .filter((m) => m.percentage < 100 && m.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)[0] ?? inProgressStats[0];

  // ── Last activity ──────────────────────────────────────────────────────────
  let lastActivity = null;
  if (userId) {
    try {
      lastActivity = await prisma.userLectureActivity.findFirst({
        where: { userId },
        orderBy: { lastViewedAt: "desc" },
        select: {
          lastViewedAt: true,
          source: true,
          lecture: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  name: true,
                  module: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });
    } catch {
      lastActivity = null;
    }
  }
  const lastActivityHref = lastActivity
    ? `/modules/${lastActivity.lecture.subject.module?.id ?? ""}/lectures/${lastActivity.lecture.id}`
    : null;

  const recentModules = inProgressStats.slice(-3);

  const hasAnyModules = allModules.length > 0;
  const hasNoSemester = !semesterId && !isGuest;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar userName={user?.name} userImage={user?.image} />
      <PageContainer>
        <ModulesContent>

        {/* ── HERO + STATS (current semester only) ── */}
        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <HeroSection
            lastActivityHref={lastActivityHref}
          />
          <StatsCard
            totalModules={totalModules}
            totalLectures={totalLectures}
            totalQuestions={totalQuestions}
            completionPercent={overallPercent}
          />
        </section>

        {/* ── QUICK ACTIONS ── */}
        <div className="mt-6">
          <QuickActions />
        </div>

        {/* ── GUEST BANNER ── */}
        {isGuest && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-xs uppercase tracking-widest">Guest Access</p>
              <p className="text-muted-foreground text-[10px] font-medium mt-0.5">
                Sign in to track your mastery levels and unlock personalized study plans.
                <Link href="/login" className="ml-2 text-primary hover:underline font-semibold">Login Now &rarr;</Link>
              </p>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!hasAnyModules && !isGuest ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-[32px] border border-dashed border-border/30 bg-card/20 py-24 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-card/40">
              <BookOpen className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Library Empty</h2>
            <p className="mt-2 text-muted-foreground text-sm font-medium max-w-sm mx-auto">
              {hasNoSemester
                ? "Please complete your profile by selecting your university and semester to view available modules."
                : "Your academic curriculum is currently being updated. Check back soon for new modules."}
            </p>
            {hasNoSemester && (
              <Link
                href="/profile/edit"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-elevated)]"
              >
                Configure Profile
              </Link>
            )}
          </div>
        ) : hasAnyModules ? (
          <>
            {/* ── FEATURED + RECENTLY UPDATED (current semester) ── */}
            {inProgressStats.length > 0 && (
              <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.35fr]">
                {featured && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold">Continue Learning</h2>
                    <FeaturedModuleCard module={featured} index={0} />
                  </div>
                )}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Recently Updated</h2>
                    <button className="text-xs text-primary hover:underline">View All</button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recentModules.map((m, i) => (
                      <RecentModuleCard key={m.id} module={m} index={i} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            <ModuleSection
              inProgress={inProgressStats}
              completed={completedStats}
              semesterGroups={semesterGroups}
              isGuest={isGuest}
              isAdmin={isAdmin}
            />
          </>
        ) : null}
        </ModulesContent>
      </PageContainer>
    </div>
  );
}
