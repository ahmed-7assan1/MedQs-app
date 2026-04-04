import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Lock, ChevronRight, Clock, Signal } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { MedqsCard } from "@/components/ui/MedqsCard";

function moduleDifficultyLabel(
  questions: { difficulty: string }[]
): { label: string; tone: string } | null {
  if (questions.length === 0) return null;
  let e = 0,
    m = 0,
    h = 0;
  for (const q of questions) {
    if (q.difficulty === "EASY") e++;
    else if (q.difficulty === "MEDIUM") m++;
    else h++;
  }
  const n = questions.length;
  if (h / n >= 0.35) return { label: "Advanced", tone: "text-red-600 dark:text-red-400" };
  if ((m + h) / n >= 0.45) return { label: "Mixed", tone: "text-amber-600 dark:text-amber-400" };
  return { label: "Foundational", tone: "text-emerald-600 dark:text-emerald-400" };
}

export default async function ModulesPage() {
  const session = await auth();
  const isGuest = !session?.user?.id;
  const userId = session?.user?.id;

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
    });
    for (const item of items) {
      const moduleId = item.question.lecture.subject.moduleId;
      if (!correctByModule[moduleId]) correctByModule[moduleId] = new Set();
      correctByModule[moduleId].add(item.questionId);
    }
  }

  return (
    <StudentPageShell
      eyebrow="Curriculum"
      title="Modules"
      subtitle={
        isGuest
          ? "Sign in to open lectures and track progress."
          : user?.semesterId
            ? "Each module lists question counts, difficulty mix, and your completion."
            : "Select a semester in your profile to see your modules."
      }
    >
      {isGuest && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <Lock className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Browsing as guest.{" "}
            <Link href="/login" className="font-semibold underline">
              Sign in
            </Link>{" "}
            to continue.
          </p>
        </div>
      )}

      {modules.length === 0 && !isGuest ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground opacity-25" aria-hidden />
          <p className="font-display text-lg font-semibold">No modules yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.semesterId ? "Content will appear once added by your admin." : "Update your profile to select a semester."}
          </p>
          {!user?.semesterId && (
            <Link
              href="/profile/edit"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Select semester
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((mod) => {
            const lecturesFlat = mod.subjects.flatMap((s) => s.lectures);
            const allQ = lecturesFlat.flatMap((l) => l.questions);
            const allQCount = lecturesFlat.reduce((a, l) => a + l._count.questions, 0);
            const corrQ = correctByModule[mod.id]?.size ?? 0;
            const modPct = allQCount > 0 ? Math.round((corrQ / allQCount) * 100) : 0;
            const totalLectures = lecturesFlat.length;
            const diff = moduleDifficultyLabel(allQ);
            const estMin = allQCount > 0 ? Math.max(5, Math.ceil(allQCount * 1.2)) : null;

            return (
              <Link
                key={mod.id}
                href={isGuest ? "/login" : `/modules/${mod.id}`}
                className={cn("block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl", isGuest && "opacity-90")}
              >
                <MedqsCard hover className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/12">
                      <BookOpen className="h-6 w-6 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display text-lg font-semibold leading-snug">{mod.name}</h2>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground/60" aria-hidden />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {mod.subjects.length} subject{mod.subjects.length !== 1 ? "s" : ""} · {totalLectures} lecture
                        {totalLectures !== 1 ? "s" : ""} · {allQCount} questions
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {diff && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border border-border/80 px-2.5 py-0.5 text-[11px] font-semibold",
                              diff.tone
                            )}
                          >
                            <Signal className="h-3 w-3" aria-hidden />
                            {diff.label}
                          </span>
                        )}
                        {estMin != null && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden />
                            ~{estMin} min
                          </span>
                        )}
                        {!isGuest && allQCount > 0 && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                            {modPct}% complete
                          </span>
                        )}
                      </div>
                      {!isGuest && allQCount > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-2 max-w-[220px] flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                modPct >= 70 ? "bg-emerald-500" : modPct >= 40 ? "bg-amber-500" : "bg-primary"
                              )}
                              style={{ width: `${modPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {corrQ}/{allQCount} correct
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </MedqsCard>
              </Link>
            );
          })}
        </div>
      )}
    </StudentPageShell>
  );
}
