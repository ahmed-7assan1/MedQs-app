import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Lock, GraduationCap, Library, Layers } from "lucide-react";
import ModulesGrid, { ModuleWithStats } from "@/components/modules/ModulesGrid";
import { Prisma } from "@prisma/client";

export const revalidate = 60;

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

  // Page-level stats for hero
  const totalModules = modules.length;
  const totalLectures = modulesWithStats.reduce((a: number, m) => a + m.lecturesCount, 0);
  const totalQuestions = modulesWithStats.reduce((a: number, m) => a + m.questionsCount, 0);

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-[#07080f] pb-32 pt-0 relative overflow-hidden">
      {/* Background Gradients — hide on mobile */}
      <div className="hidden md:block absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="hidden md:block absolute top-40 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* ── Responsive Hero ── */}
      <div className="relative w-full overflow-hidden">
        {/* Mobile-only top gradient accent */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent h-[200px] pointer-events-none" />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-slate-950 dark:from-[#534AB7]/10 dark:to-[#07080f] z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-15 md:dark:opacity-25 pointer-events-none" />

        <div className="relative z-20 container mx-auto px-4 sm:px-6 pb-6 md:pb-12 pt-4 md:pt-0 md:h-[350px] md:flex md:items-end">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 md:space-y-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <BookOpen className="h-3 w-3 md:h-3.5 md:w-3.5" />
                Knowledge Repository
              </div>

              {/* Title */}
              <h1 className="text-[32px] sm:text-4xl md:text-7xl font-black tracking-tighter text-white">
                Medical <span className="text-primary">Library</span><span className="text-primary hidden md:inline">.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs md:text-sm text-white/40 font-bold uppercase tracking-wider max-w-xl">
                Master your curriculum through structured clinical modules.
              </p>
            </div>

            {/* Quick Stats Row — hidden on mobile when no modules */}
            {modules.length > 0 && (
              <div className="flex items-center gap-2 md:gap-4 flex-wrap mt-2 md:mt-0">
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] md:text-xs font-black text-white/50 uppercase tracking-wider">
                  <Library className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
                  {totalModules} Modules
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] md:text-xs font-black text-white/50 uppercase tracking-wider">
                  <GraduationCap className="h-3 w-3 md:h-3.5 md:w-3.5 text-violet-400" />
                  {totalLectures} Lectures
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] md:text-xs font-black text-white/50 uppercase tracking-wider">
                  <Layers className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-400" />
                  {totalQuestions} Qs
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 space-y-8 md:space-y-12 relative z-20">
        {isGuest && (
          <div className="flex items-center gap-3 md:gap-4 rounded-2xl md:rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 md:p-6 backdrop-blur-md">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
            </div>
            <div>
              <p className="font-black text-white uppercase tracking-widest text-xs md:text-sm">Guest Access</p>
              <p className="text-white/40 text-[10px] md:text-xs font-medium mt-1">
                Sign in to track your mastery levels and unlock personalized study plans.
                <Link href="/login" className="ml-2 text-primary hover:underline font-bold">Login Now &rarr;</Link>
              </p>
            </div>
          </div>
        )}

        {modules.length === 0 && !isGuest ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] py-16 md:py-32 text-center">
            <div className="mb-6 md:mb-8 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-[20px] md:rounded-[24px] bg-white/5">
              <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-white/20" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest">Library Empty</h2>
            <p className="mt-2 text-white/40 font-medium max-w-sm mx-auto text-sm md:text-base">
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
          <ModulesGrid modules={modulesWithStats} totalMastered={totalMastered} isGuest={isGuest} currentStreak={currentStreak} />
        )}
      </div>
    </div>
  );
}
