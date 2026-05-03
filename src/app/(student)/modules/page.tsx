import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Lock, ChevronRight, Clock, Signal, Search, Brain, Heart, Dna, FlaskConical, Layers, Atom } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const userId = session?.user?.id;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { semesterId: true } })
    : null;

  const modules = user?.semesterId
    ? await prisma.module.findMany({
      where: { semesterId: user.semesterId },
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
    })
    : [];

  const correctByModule: Record<string, Set<string>> = {};
  if (userId && modules.length > 0) {
    const items = await prisma.quizAttemptItem.findMany({
      where: { attempt: { userId }, isCorrect: true },
      select: {
        questionId: true,
        question: { select: { lecture: { select: { subject: { select: { moduleId: true } } } } } },
      },
    });
    for (const item of items) {
      const moduleId = item.question.lecture.subject.moduleId;
      if (!moduleId) continue;
      if (!correctByModule[moduleId]) correctByModule[moduleId] = new Set();
      correctByModule[moduleId].add(item.questionId);
    }
  }

  const totalMastered = Object.values(correctByModule).reduce((acc, set) => acc + set.size, 0);

  return (
    <div className="min-h-screen bg-[#07080f] pb-32 pt-0">
      {/* ── Immersive Hero ── */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-gradient-to-b from-[#534AB7]/20 via-transparent to-[#07080f] z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-pulse" />
        
        <div className="relative z-20 container mx-auto px-6 pb-12">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">
                    <BookOpen className="h-3.5 w-3.5" />
                    Knowledge Repository
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-2">
                    Medical <span className="text-primary">Library.</span>
                 </h1>
                 <p className="text-white/40 font-bold uppercase tracking-widest text-sm max-w-xl">
                    Master your curriculum through structured clinical modules and expert lectures.
                 </p>
              </div>

              {/* Stats Box */}
              {!isGuest && (
                 <div className="flex items-center gap-8 bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[32px] p-6 md:p-8">
                    <div className="text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Modules</p>
                       <p className="text-3xl font-black text-white">{modules.length}</p>
                    </div>
                    <div className="w-[1px] h-12 bg-white/5" />
                    <div className="text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Mastered</p>
                       <p className="text-3xl font-black text-primary">{totalMastered}</p>
                    </div>
                    <div className="w-[1px] h-12 bg-white/5" />
                    <div className="text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Level</p>
                       <p className="text-3xl font-black text-white">Lvl {Math.floor(totalMastered / 100) + 1}</p>
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
                  <div className="relative h-full overflow-hidden rounded-[32px] border border-white/5 bg-[#131220] p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity">
                       <IconComp className="h-32 w-32" />
                    </div>

                    <div className="flex flex-col h-full space-y-6">
                      <div className="flex items-start justify-between">
                         <div className={cn(
                           "flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] group-hover:bg-primary/20 transition-colors",
                           accent.bg
                         )}>
                           <IconComp className="h-6 w-6 text-primary" aria-hidden />
                         </div>
                         <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-primary group-hover:text-white transition-all">
                            <ChevronRight className="h-4 w-4" />
                         </div>
                      </div>

                      <div className="flex-1">
                        <h2 className="text-xl font-black text-white leading-tight group-hover:text-primary transition-colors">{mod.name}</h2>
                        <p className="mt-2 text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">
                           {mod.subjects.length} Subjects • {lecturesFlat.length} Lectures
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Mastery Level</span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{modPct}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
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
