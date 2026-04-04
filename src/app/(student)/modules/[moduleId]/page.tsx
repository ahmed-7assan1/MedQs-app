import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, Layers, FileText, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true },
  });

  const mod = await prisma.module.findFirst({
    where: { id: params.moduleId, semesterId: user?.semesterId ?? "__none__" },
    include: {
      subjects: {
        orderBy: { name: "asc" },
        include: {
          lectures: {
            orderBy: { order: "asc" },
            include: {
              _count: { select: { questions: true, flashcards: true } },
              files: { select: { id: true } },
            },
          },
        },
      },
      pastPapers: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          timeLimitMin: true,
          isInteractive: true,
          _count: { select: { attempts: true } },
        },
      },
    },
  });

  if (!mod) notFound();

  const correctBySubject: Record<string, Set<string>> = {};
  const items = await prisma.quizAttemptItem.findMany({
    where: { attempt: { userId: session.user.id }, isCorrect: true },
    select: {
      questionId: true,
      question: { select: { lecture: { select: { subjectId: true } } } },
    },
  });
  for (const item of items) {
    const sid = item.question.lecture.subjectId;
    if (!correctBySubject[sid]) correctBySubject[sid] = new Set();
    correctBySubject[sid].add(item.questionId);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/modules" className="hover:text-foreground">
          Modules
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{mod.name}</span>
      </nav>

      <h1 className="mb-2 font-display text-3xl font-bold tracking-tight">{mod.name}</h1>
      <p className="mb-8 text-sm text-muted-foreground">Pick a subject, then a lecture.</p>

      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subjects</div>
      <div className="space-y-2">
        {mod.subjects.map((subject) => {
          const subjQ = subject.lectures.reduce((a, l) => a + l._count.questions, 0);
          const subjCorr = correctBySubject[subject.id]?.size ?? 0;
          const subjPct = subjQ > 0 ? Math.round((subjCorr / subjQ) * 100) : 0;

          return (
            <Link
              key={subject.id}
              href={`/modules/${mod.id}/subjects/${subject.id}`}
              className="surface-card flex items-center gap-4 p-4 transition-all hover:border-primary/35"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{subject.name}</p>
                <p className="text-xs text-muted-foreground">
                  {subject.lectures.length} lecture{subject.lectures.length !== 1 ? "s" : ""}
                </p>
                {subjQ > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          subjPct >= 70 ? "bg-emerald-500" : subjPct >= 40 ? "bg-amber-500" : "bg-primary/60"
                        )}
                        style={{ width: `${subjPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{subjPct}%</span>
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground/50" />
            </Link>
          );
        })}
      </div>

      {mod.pastPapers.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past papers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mod.pastPapers.map((paper) => (
              <Link
                key={paper.id}
                href={`/quiz/${paper.id}`}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{paper.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {paper.timeLimitMin && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {paper.timeLimitMin}m
                      </span>
                    )}
                    {paper.isInteractive && (
                      <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        Interactive
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      {paper._count.attempts} attempts
                    </span>
                  </div>
                </div>
                <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground/40" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
