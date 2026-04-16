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
    return { bg: "bg-teal-500/10", icon: Heart, border: "border-l-teal-500", progress: "from-teal-500 to-cyan-400", shadow: "shadow-teal-500/10" };
  if (n.includes("ENR") || n.includes("RENAL") || n.includes("RESP"))
    return { bg: "bg-sky-500/10", icon: Dna, border: "border-l-sky-500", progress: "from-sky-500 to-blue-400", shadow: "shadow-sky-500/10" };
  if (n.includes("RESEARCH") || n.includes("STATS"))
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
                include: {
                  _count: { select: { questions: true, flashcards: true } },
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
      if (!correctByModule[moduleId]) correctByModule[moduleId] = new Set();
      correctByModule[moduleId].add(item.questionId);
    }
  }

  return (
    <StudentPageShell maxWidthClass="max-w-5xl">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Curriculum</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Your Modules</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isGuest
                ? "Sign in to track progress and open lectures."
                : user?.semesterId
                  ? "Track your progress across all subjects."
                  : "Select a semester in your profile to see modules."}
            </p>
          </div>
        </div>
      </div>

      {isGuest && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <Lock className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Browsing as guest.{" "}
            <Link href="/login" className="font-semibold underline">Sign in</Link>{" "}
            to continue.
          </p>
        </div>
      )}

      {!isGuest && isAdmin && user?.semesterId ? (
        <ModuleInlineManager
          semesterId={user.semesterId}
          initialModules={modules.map((m) => ({ id: m.id, name: m.name }))}
        />
      ) : null}

      {modules.length === 0 && !isGuest ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground opacity-40" aria-hidden />
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
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((mod, i) => {
            const lecturesFlat = mod.subjects.flatMap((s) => s.lectures);
            const allQ = lecturesFlat.flatMap((l) => l.questions);
            const allQCount = lecturesFlat.reduce((a, l) => a + l._count.questions, 0);
            const corrQ = correctByModule[mod.id]?.size ?? 0;
            const modPct = allQCount > 0 ? Math.round((corrQ / allQCount) * 100) : 0;
            const totalLectures = lecturesFlat.length;
            const diff = moduleDifficultyLabel(allQ);
            const estMin = allQCount > 0 ? Math.max(5, Math.ceil(allQCount * 1.2)) : null;
            const accent = getModuleAccent(mod.name);
            const IconComp = accent.icon;
            const isCompleted = allQCount > 0 && modPct === 100;
            const isInProgress = modPct > 0 && modPct < 100;

            return (
              <Link
                key={mod.id}
                href={isGuest ? "/login" : `/modules/${mod.id}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={cn(
                  "relative h-full overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-200",
                  "border-l-[3px] hover:-translate-y-[2px] hover:shadow-lg",
                  accent.border,
                  accent.shadow,
                  "hover:border-opacity-80"
                )}>
                  {/* Completed badge */}
                  {isCompleted && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ Done</span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Colored icon */}
                    <div className={cn(
                      "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                      accent.bg
                    )}>
                      <IconComp className="h-6 w-6 text-foreground/70" aria-hidden />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[17px] font-semibold leading-snug">{mod.name}</h2>

                      {/* Stats chips */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="text-xs text-muted-foreground">
                          {mod.subjects.length} subject{mod.subjects.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground">
                          {totalLectures} lecture{totalLectures !== 1 ? "s" : ""}
                        </span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground">{allQCount} questions</span>
                      </div>

                      {/* Badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {diff && (
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", diff.bg, diff.tone)}>
                            <Signal className="h-2.5 w-2.5" aria-hidden />
                            {diff.label}
                          </span>
                        )}
                        {estMin != null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" aria-hidden />
                            ~{estMin} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress section */}
                  {!isGuest && allQCount > 0 && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {corrQ > 0 ? `${corrQ}/${allQCount} correct` : "Start your first question!"}
                        </span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold",
                          modPct === 0 ? "bg-muted text-muted-foreground"
                            : modPct >= 70 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        )}>
                          {modPct}%
                        </span>
                      </div>
                      <div className="h-[5px] w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out", accent.progress)}
                          style={{ width: `${Math.max(modPct, modPct > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* "Continue → " hover hint */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5">
                    Continue <ChevronRight className="h-3 w-3" />
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
