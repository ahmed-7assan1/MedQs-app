import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Lock, GraduationCap, Library, Layers } from "lucide-react";
import ModulesGrid, { ModuleWithStats } from "@/components/modules/ModulesGrid";
import ContinueLearningCard from "@/components/modules/ContinueLearningCard";
import { Prisma } from "@prisma/client";
import type { Metadata } from "next";

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

export default async function ModulesPage() {
  const session = await auth();
  const isGuest = !session?.user?.id;
  const user = session?.user;
  const userId = user?.id;

  let semesterId = (user as any)?.semesterId;
  let role = (user as any)?.role;

  // Fallback to Prisma if Supabase metadata is missing the semesterId or role
  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { semesterId: true, role: true }
    });
    if (dbUser) {
      if (!semesterId) semesterId = dbUser.semesterId;
      role = dbUser.role || role;
    }
  }
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  // Fetch modules for the user's semester
  const modules = await prisma.module.findMany({
    where: { semesterId: semesterId ?? "__none__" },
    orderBy: { name: "asc" },
    include: {
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
  }).catch(() => []);

  // Compute streak dynamically for logged-in users
  const currentStreak = userId ? await computeStreak(userId) : 0;

  // Fetch mastery counts efficiently
  let totalMastered = 0;
  const correctByModule: Record<string, Set<string>> = {};

  if (userId && modules.length > 0) {
    // Single query to get all correct questions for this user
    const [dbTotalMastered, items] = await Promise.all([
      prisma.quizAttemptItem.count({ where: { attempt: { userId }, isCorrect: true } }).catch(() => 0),
      prisma.quizAttemptItem.findMany({
        where: { attempt: { userId }, isCorrect: true },
        select: {
          questionId: true,
          question: { select: { lecture: { select: { subject: { select: { moduleId: true } } } } } },
        },
      }).catch(() => []),
    ]);

    totalMastered = dbTotalMastered;
    for (const item of items) {
      const moduleId = item.question.lecture.subject.moduleId;
      if (!moduleId) continue;
      if (!correctByModule[moduleId]) correctByModule[moduleId] = new Set();
      correctByModule[moduleId].add(item.questionId);
    }

    // Add unique set sizes to total
    totalMastered = Object.values(correctByModule).reduce((acc, set) => acc + set.size, totalMastered);
  }

  // Map modules into ModuleWithStats type
  const modulesWithStats: ModuleWithStats[] = modules.map((mod: any) => {
    const lecturesFlat = mod.subjects.flatMap((s: any) => s.lectures);
    const questionsFlat = lecturesFlat.flatMap((l: any) => l.questions);
    const allQCount = lecturesFlat.reduce((a: number, l: any) => a + l._count.questions, 0);
    const corrQ = correctByModule[mod.id]?.size ?? 0;
    const modPct = allQCount > 0 ? Math.round((corrQ / allQCount) * 100) : 0;
    const difficulty = moduleDifficultyLabel(questionsFlat);
    const subjectNames = mod.subjects.map((s: any) => s.name);

    return {
      id: mod.id,
      name: mod.name,
      icon: mod.icon,
      subjectsCount: mod.subjects.length,
      lecturesCount: lecturesFlat.length,
      questionsCount: allQCount,
      masteredCount: corrQ,
      percentage: modPct,
      difficulty,
      subjectNames
    };
  });

  // Fetch semester info for hero
  const semesterInfo = semesterId ? await prisma.semester.findUnique({
    where: { id: semesterId },
    select: { name: true, academicYear: { select: { university: { select: { name: true } } } } },
  }) : null;
  const semesterName = semesterInfo?.name ?? "";
  const universityName = semesterInfo?.academicYear?.university?.name ?? "";

  // Fetch last lecture activity for "Continue Learning" card
  const lastActivity = userId ? await prisma.userLectureActivity.findFirst({
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
              id: true,
              name: true,
              module: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  }) : null;

  // Page-level stats for hero
  const totalModules = modules.length;
  const completedModules = modulesWithStats.filter(m => m.percentage >= 80).length;
  const totalLectures = modulesWithStats.reduce((a: number, m) => a + m.lecturesCount, 0);
  const totalQuestions = modulesWithStats.reduce((a: number, m) => a + m.questionsCount, 0);

  return (
    <div className="min-h-screen pb-32 pt-0 relative overflow-hidden bg-background">
      {/* Background ambient glow — desktop only */}
      <div className="hidden md:block absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="hidden md:block absolute top-40 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* ── MOBILE SPACER ── */}
      <div className="md:hidden h-6" />

      {/* ── DESKTOP HERO ── */}
      <div className="hidden md:block relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent dark:from-[#534AB7]/10 z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-25 pointer-events-none" />

        <div className="relative z-20 container mx-auto px-6 pb-10 pt-0 h-[320px] flex items-end">
          <div className="flex flex-row items-end justify-between gap-6 w-full">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <BookOpen className="h-3.5 w-3.5" />
                Knowledge Repository
              </div>

              <h1 className="text-7xl font-black tracking-tighter dark:text-white text-foreground leading-none">
                Medical <span className="text-primary">Library</span><span className="text-primary">.</span>
              </h1>

              <p className="text-sm dark:text-white/40 text-muted-foreground font-bold uppercase tracking-wider max-w-xl">
                Master your curriculum through structured clinical modules.
              </p>
            </div>

            {modules.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border dark:border-white/[0.06] border-border/30 dark:bg-white/[0.02] bg-card/40 backdrop-blur-xl text-xs font-black dark:text-white/50 text-muted-foreground uppercase tracking-wider shadow-lg shadow-black/10">
                  <Library className="h-3.5 w-3.5 text-primary" />
                  {totalModules} Modules
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border dark:border-white/[0.06] border-border/30 dark:bg-white/[0.02] bg-card/40 backdrop-blur-xl text-xs font-black dark:text-white/50 text-muted-foreground uppercase tracking-wider shadow-lg shadow-black/10">
                  <GraduationCap className="h-3.5 w-3.5 text-violet-400" />
                  {totalLectures} Lectures
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border dark:border-white/[0.06] border-border/30 dark:bg-white/[0.02] bg-card/40 backdrop-blur-xl text-xs font-black dark:text-white/50 text-muted-foreground uppercase tracking-wider shadow-lg shadow-black/10">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  {totalQuestions} Qs
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="container mx-auto px-4 sm:px-6 space-y-8 md:space-y-12 relative z-20">
        {/* ── Mobile continue learning card ── */}
        {!isGuest && lastActivity && (
          <div className="md:hidden">
            <ContinueLearningCard
              lectureId={lastActivity.lecture.id}
              lectureTitle={lastActivity.lecture.title}
              subjectName={lastActivity.lecture.subject.name}
              moduleId={lastActivity.lecture.subject.module.id}
              moduleName={lastActivity.lecture.subject.module.name}
              lastViewedAt={lastActivity.lastViewedAt}
              source={lastActivity.source}
            />
          </div>
        )}

        {/* ── Mobile metadata strip ── */}
        {!isGuest && (semesterName || totalModules > 0) && (
          <div className="md:hidden flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              <span className="truncate">{semesterName || "Current Semester"}</span>
              {universityName && (
                <>
                  <span className="text-muted-foreground/20 shrink-0">·</span>
                  <span className="truncate">{universityName}</span>
                </>
              )}
            </div>
            <span className="shrink-0 ml-3 text-[10px] font-black text-foreground/80 tabular-nums">
              {completedModules}/{totalModules}
            </span>
          </div>
        )}

        {isGuest && (
          <div className="flex items-center gap-3 md:gap-4 rounded-2xl md:rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 md:p-6 backdrop-blur-md">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
            </div>
            <div>
              <p className="font-black dark:text-white text-foreground uppercase tracking-widest text-xs md:text-sm">Guest Access</p>
              <p className="dark:text-white/40 text-muted-foreground text-[10px] md:text-xs font-medium mt-1">
                Sign in to track your mastery levels and unlock personalized study plans.
                <Link href="/login" className="ml-2 text-primary hover:underline font-bold">Login Now &rarr;</Link>
              </p>
            </div>
          </div>
        )}

        {modules.length === 0 && !isGuest ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-border/30 bg-card/20 py-16 md:py-32 text-center">
            <div className="mb-6 md:mb-8 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-[20px] md:rounded-[24px] bg-card/40">
              <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-widest">Library Empty</h2>
            <p className="mt-2 text-muted-foreground font-medium max-w-sm mx-auto text-sm md:text-base">
              {semesterId 
                ? "Your academic curriculum is currently being updated. Check back soon for new modules." 
                : "Please complete your profile by selecting your university and semester to view available modules."}
            </p>
            {!semesterId && (
              <Link href="/profile/edit"
                className="mt-6 md:mt-8 inline-flex items-center gap-3 rounded-2xl btn-gradient px-6 md:px-8 py-3 md:py-3.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                Configure Profile
              </Link>
            )}
          </div>
        ) : (
          <ModulesGrid modules={modulesWithStats} isGuest={isGuest} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
