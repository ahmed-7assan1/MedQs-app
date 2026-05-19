import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import ModulesGrid, { ModuleWithStats } from "@/components/modules/ModulesGrid";

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
      subjectsCount: mod.subjects.length,
      lecturesCount: lecturesFlat.length,
      questionsCount: allQCount,
      masteredCount: corrQ,
      percentage: modPct,
      difficulty,
      subjectNames
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-[#07080f] pb-32 pt-0 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* ── Immersive Hero ── */}
      <div className="relative hidden md:flex h-[350px] w-full overflow-hidden items-end">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-slate-950 dark:from-[#534AB7]/10 dark:to-[#07080f] z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-25" />
        
        <div className="relative z-20 container mx-auto px-6 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">
                <BookOpen className="h-3.5 w-3.5" />
                Knowledge Repository
              </div>
              <h1 className="text-7xl font-black tracking-tighter text-white mb-2">
                Medical <span className="text-primary">Library.</span>
              </h1>
              <p className="text-white/40 font-bold uppercase tracking-widest text-sm max-w-xl">
                Master your curriculum through structured clinical modules.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Title Row */}
      <div className="md:hidden pt-20 px-6 pb-2 space-y-1">
        <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">
          Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Library</span>
        </h1>
        <p className="text-xs text-white/40 font-bold uppercase tracking-wider">
          Structured clinical modules & disciplines
        </p>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 space-y-12 relative z-20">
        {isGuest && (
          <div className="flex items-center gap-4 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-md">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="font-black text-white uppercase tracking-widest text-sm">Guest Access</p>
              <p className="text-white/40 text-xs font-medium mt-1">
                Sign in to track your mastery levels and unlock personalized study plans.
                <Link href="/login" className="ml-2 text-primary hover:underline font-bold">Login Now &rarr;</Link>
              </p>
            </div>
          </div>
        )}

        {modules.length === 0 && !isGuest ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] py-32 text-center">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/5">
              <BookOpen className="h-10 w-10 text-white/20" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Library Empty</h2>
            <p className="mt-2 text-white/40 font-medium max-w-sm mx-auto">
              {semesterId 
                ? "Your academic curriculum is currently being updated. Check back soon for new modules." 
                : "Please complete your profile by selecting your university and semester to view available modules."}
            </p>
            {!semesterId && (
              <Link href="/profile/edit"
                className="mt-8 inline-flex items-center gap-3 rounded-2xl btn-gradient px-8 py-3.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                Configure Profile
              </Link>
            )}
          </div>
        ) : (
          <ModulesGrid modules={modulesWithStats} totalMastered={totalMastered} isGuest={isGuest} />
        )}
      </div>
    </div>
  );
}
