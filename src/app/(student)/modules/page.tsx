import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Lock, ChevronRight, Clock, Signal, Search, Brain, Heart, Dna, FlaskConical, Layers, Atom } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { ModuleInlineManager } from "@/components/admin-inline/ModuleInlineManager";

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

  return (
    <StudentPageShell maxWidthClass="max-w-[1200px]" noTopPaddingMobile>
      {/* ── Page Header ── */}
      <div className="mb-10 px-4 md:px-0">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Course Curriculum</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Your Modules</h1>
            <p className="mt-1 text-[13px] text-muted-foreground max-w-lg">
              {isGuest
                ? "Sign in to track progress and open lectures."
                : user?.semesterId
                  ? "Track your academic journey and master each clinical module."
                  : "Select a semester in your profile to see modules."}
            </p>
          </div>
        </div>
      </div>

      {isGuest && (
        <div className="mx-4 mb-6 md:mx-0 flex items-center gap-3 rounded-xl border border-amber-200/50 bg-amber-50 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10">
          <Lock className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="text-[12px] text-amber-800 dark:text-amber-200">
            Browsing as guest.{" "}
            <Link href="/login" className="font-semibold underline">Sign in</Link>{" "}
            to continue.
          </p>
        </div>
      )}

      {modules.length === 0 && !isGuest ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground opacity-40" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold">No modules yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.semesterId ? "Content will appear once added by your admin." : "Update your profile to select a semester."}
          </p>
          {!user?.semesterId && (
            <Link href="/profile/edit"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              Select semester
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 px-4 md:px-0 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod: any) => {
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
                className="group block"
              >
                <div className="relative h-full overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10",
                      accent.bg
                    )}>
                      <IconComp className="h-4 w-4 text-primary" aria-hidden />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[14px] font-bold leading-snug group-hover:text-primary transition-colors">{mod.name}</h2>
                      
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{modPct}% Mastered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </StudentPageShell>
  );
}
