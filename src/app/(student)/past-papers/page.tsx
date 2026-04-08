import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, BarChart3, ChevronRight, Eye, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function PastPapersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true },
  });

  const papers = await prisma.pastPaper.findMany({
    where: user?.semesterId ? { semesterId: user.semesterId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      module: { select: { name: true } },
      attempts: {
        where: { userId: session.user.id },
        orderBy: { score: "desc" },
        take: 3,
        select: { id: true, score: true, createdAt: true },
      },
      _count: { select: { attempts: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {papers.length} quiz{papers.length !== 1 ? "zes" : ""} available
          </p>
        </div>
        {isAdmin ? (
          <Link
            href="/admin/quiz-creator"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 active:scale-[0.98] transition"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create quiz
          </Link>
        ) : null}
      </div>

      {papers.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground opacity-40" />
          <p className="font-medium">No past papers yet</p>
          <p className="text-sm text-muted-foreground">Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => {
            const bestAttempt = paper.attempts[0];
            const bestScore   = bestAttempt?.score;
            const allAttempts = paper.attempts;

            return (
              <div key={paper.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Main row */}
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{paper.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{paper.module.name}</span>
                        {paper.timeLimitMin && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {paper.timeLimitMin} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" /> {paper._count.attempts} attempts
                        </span>
                        {paper.isInteractive && (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                            Interactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    {isAdmin ? (
                      <Link
                        href={`/admin/quiz-creator?paperId=${paper.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition"
                        title="Manage this quiz"
                      >
                        <Settings2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                        Manage
                      </Link>
                    ) : null}
                    {bestScore !== undefined && (
                      <span className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        bestScore >= 70
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : bestScore >= 50
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        Best: {bestScore}%
                      </span>
                    )}
                    <Link
                      href={`/quiz/${paper.id}`}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {bestAttempt ? "Retry" : "Start"}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Previous attempts row */}
                {allAttempts.length > 0 && (
                  <div className="border-t border-border bg-muted/20 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground mr-1">Previous attempts:</span>
                      {allAttempts.map((attempt, i) => (
                        <Link
                          key={attempt.id}
                          href={`/quiz/attempt/${attempt.id}`}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted hover:border-primary/40 transition-colors"
                        >
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className={cn(
                            "font-semibold",
                            attempt.score >= 70 ? "text-green-600 dark:text-green-400" :
                            attempt.score >= 50 ? "text-amber-600 dark:text-amber-400" :
                            "text-red-500"
                          )}>
                            {attempt.score}%
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(attempt.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </span>
                        </Link>
                      ))}
                      {paper._count.attempts > 3 && (
                        <span className="text-xs text-muted-foreground">+{paper._count.attempts - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
