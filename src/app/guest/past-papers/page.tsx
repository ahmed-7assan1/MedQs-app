import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { GUEST_QUIZ_COOKIE } from "@/lib/guest-quiz";
import { GuestIdentifyForm } from "./GuestIdentifyForm";
import { FileText, Clock, BarChart3, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GuestPastPapersPage() {
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_QUIZ_COOKIE)?.value?.trim() ?? null;

  if (!guestId) {
    return <GuestIdentifyForm />;
  }

  const guest = await prisma.guestQuizUser.findUnique({
    where: { id: guestId },
    select: { id: true, displayName: true, externalStudentId: true },
  });

  if (!guest) {
    return <GuestIdentifyForm />;
  }

  const papers = await prisma.pastPaper.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      module: { select: { name: true } },
      _count: { select: { attempts: true } },
    },
  });

  const attempts = await prisma.quizAttempt.findMany({
    where: { guestQuizUserId: guest.id },
    select: { pastPaperId: true, score: true, id: true },
  });
  const bestByPaper = new Map<string, { score: number; attemptId: string }>();
  for (const a of attempts) {
    const cur = bestByPaper.get(a.pastPaperId);
    if (!cur || a.score > cur.score) {
      bestByPaper.set(a.pastPaperId, { score: a.score, attemptId: a.id });
    }
  }

  return (
    <div>
      <p className="mb-6 text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{guest.displayName}</span> (ID:{" "}
        {guest.externalStudentId})
      </p>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Quizzes</h1>
        <p className="mt-1 text-sm text-muted-foreground">{papers.length} available</p>
      </div>

      {papers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No quizzes published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => {
            const best = bestByPaper.get(paper.id);
            return (
              <div key={paper.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{paper.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{paper.module.name}</span>
                        {paper.timeLimitMin ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {paper.timeLimitMin} min
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" /> {paper._count.attempts} attempts
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {best !== undefined && (
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          best.score >= 70
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : best.score >= 50
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        Best: {best.score}%
                      </span>
                    )}
                    <Link
                      href={`/guest/quiz/${paper.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
                    >
                      Start <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
