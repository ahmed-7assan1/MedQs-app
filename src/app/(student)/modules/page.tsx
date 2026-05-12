import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Lock, ChevronRight, Clock, Signal, Search, Brain, Heart, Dna, FlaskConical, Layers, Atom } from "lucide-react";
import { cn } from "@/lib/utils";

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
  if (h / n >= 0.35) return { label: "Advanced", tone: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
  if ((m + h) / n >= 0.45) return { label: "Mixed", tone: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
  return { label: "Foundational", tone: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" };
}

// Assign a unique color identity per module name
function getModuleAccent(name: string): { bg: string; icon: any; border: string; progress: string; shadow: string } {
  const n = name.toUpperCase();
  if (n.includes("CNS") || n.includes("NEURO"))
    return { bg: "bg-violet-500/10", icon: Brain, border: "border-l-violet-500", progress: "from-violet-500 to-purple-400", shadow: "shadow-violet-500/10" };
  if (n.includes("ECE") || n.includes("CARDIO") || n.includes("ENDO"))
    return { bg: "bg-rose-500/10", icon: Heart, border: "border-l-rose-500", progress: "from-rose-500 to-pink-400", shadow: "shadow-rose-500/10" };
  if (n.includes("GENETIC") || n.includes("CELL") || n.includes("GENE"))
    return { bg: "bg-blue-500/10", icon: Dna, border: "border-l-blue-500", progress: "from-blue-500 to-cyan-400", shadow: "shadow-blue-500/10" };
  if (n.includes("BIOCHEM") || n.includes("PHARMA"))
    return { bg: "bg-amber-500/10", icon: FlaskConical, border: "border-l-amber-500", progress: "from-amber-500 to-orange-400", shadow: "shadow-amber-500/10" };
  if (n.includes("GIT") || n.includes("GI"))
    return { bg: "bg-emerald-500/10", icon: Layers, border: "border-l-emerald-500", progress: "from-emerald-500 to-green-400", shadow: "shadow-emerald-500/10" };
  // Default
  return { bg: "bg-primary/10", icon: Atom, border: "border-l-primary", progress: "from-primary to-blue-400", shadow: "shadow-primary/10" };
}

export default async function ModulesPage() {
  const session = await auth();
  const isGuest = !session?.user?.id;
  const user = session?.user;
  const userId = user?.id;
  const semesterId = (user as any)?.semesterId;
  const role = (user as any)?.role;
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07080f] pb-32 pt-0">
      {/* ── Immersive Hero ── */}
      <div className="relative h-[220px] md:h-[400px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-slate-50 dark:from-[#534AB7]/20 dark:to-[#07080f] z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-20" />
        
        <div className="relative z-20 container mx-auto px-6 pb-6 md:pb-12">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                 <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">
                    <BookOpen className="h-3.5 w-3.5" />
                    Knowledge Repository
                 </div>
                 <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-1">
                    Medical <span className="text-primary">Library.</span>
                 </h1>
                 <p className="text-slate-500 dark:text-white/40 font-bold uppercase tracking-widest text-[9px] md:text-sm max-w-xl">
                    Master your curriculum through structured clinical modules.
                 </p>
              </div>

              {/* Stats Box (Mobile Optimized) */}
              {!isGuest && (
                 <div className="flex items-center justify-around md:justify-start gap-4 md:gap-8 bg-slate-50 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl md:rounded-[32px] p-4 md:p-8">
                    <div className="text-center">
                       <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-1">Modules</p>
                       <p className="text-xl md:text-3xl font-black text-slate-900 dark:text-white">{modules.length}</p>
                    </div>
                    <div className="w-[1px] h-8 md:h-12 bg-slate-200 dark:bg-white/5" />
                    <div className="text-center">
                       <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-1">Mastery</p>
                       <p className="text-xl md:text-3xl font-black text-primary">{totalMastered}</p>
                    </div>
                    <div className="w-[1px] h-8 md:h-12 bg-slate-200 dark:bg-white/5" />
                    <div className="text-center">
                       <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-1">Level</p>
                       <p className="text-xl md:text-3xl font-black text-slate-900 dark:text-white">L{Math.floor(totalMastered / 100) + 1}</p>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>

      <div className="container mx-auto px-6 space-y-12">
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
              {user?.semesterId 
                ? "Your academic curriculum is currently being updated. Check back soon for new modules." 
                : "Please complete your profile by selecting your university and semester to view available modules."}
            </p>
            {!user?.semesterId && (
              <Link href="/profile/edit"
                className="mt-8 inline-flex items-center gap-3 rounded-2xl btn-gradient px-8 py-3.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                Configure Profile
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {modules.map((mod: any, i: number) => {
              const lecturesFlat = mod.subjects.flatMap((s: any) => s.lectures);
              const allQCount = lecturesFlat.reduce((a: number, l: any) => a + l._count.questions, 0);
              const corrQ = correctByModule[mod.id]?.size ?? 0;
              const modPct = allQCount > 0 ? Math.round((corrQ / allQCount) * 100) : 0;
              const accent = getModuleAccent(mod.name);
              const IconComp = accent.icon;

              return (
                <Link
                  key={mod.id}
                  href={isGuest ? "/login" : `/modules/${mod.id}`}
                  className="group relative"
                >
                  <div className="relative h-full overflow-hidden rounded-3xl border dark:border-white/5 border-black/5 dark:bg-[#131220] bg-white p-6 md:p-8 transition-all active:scale-[0.98] shadow-lg">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.08]">
                       <IconComp className="h-24 w-24 md:h-32 md:w-32" />
                    </div>

                    <div className="flex flex-col h-full space-y-4">
                      <div className="flex items-start justify-between">
                         <div className={cn(
                           "flex h-12 w-12 items-center justify-center rounded-xl border dark:border-white/5 border-black/5 dark:bg-white/[0.03] bg-black/[0.02]",
                           accent.bg
                         )}>
                           <IconComp className="h-6 w-6 text-primary" aria-hidden />
                         </div>
                      </div>

                      <div className="flex-1">
                        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors truncate">{mod.name}</h2>
                        <p className="mt-1 text-[9px] md:text-[11px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                           {mod.subjects.length} Subjects • {lecturesFlat.length} Lectures
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Mastery</span>
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{modPct}%</span>
                         </div>
                         <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div 
                               className="h-full bg-primary rounded-full transition-all duration-1000" 
                               style={{ width: `${modPct}%` }}
                            />
                         </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
