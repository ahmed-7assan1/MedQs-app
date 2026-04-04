import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ArrowLeft, Trophy, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AttemptResultPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const siteConfig = await prisma.siteConfig
    .findFirst({ select: { enableAI: true } })
    .catch(() => null);
  const siteAiEnabled = siteConfig?.enableAI !== false;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      pastPaper: {
        select: {
          id: true,
          title: true,
          aiExplanationEnabled: true,
          allowAiDuringQuiz: true,
        },
      },
      items: {
        include: {
          question: {
            select: {
              id: true,
              body: true,
              imageUrl: true,
              stemLayout: true,
              choices: true,
              answer: true,
              explanation: true,
              difficulty: true,
              lectureId: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!attempt) notFound();
  if (attempt.userId !== session.user.id) redirect("/past-papers");

  const correct = attempt.items.filter(i => i.isCorrect).length;
  const total   = attempt.items.length;
  const mins    = Math.floor(attempt.timeTaken / 60);
  const secs    = attempt.timeTaken % 60;

  const scoreColor =
    attempt.score >= 70 ? "text-emerald-600 dark:text-emerald-400" :
    attempt.score >= 50 ? "text-amber-600 dark:text-amber-400" :
    "text-red-500";

  const scoreBg =
    attempt.score >= 70 ? "bg-emerald-50 dark:bg-emerald-900/20" :
    attempt.score >= 50 ? "bg-amber-50 dark:bg-amber-900/20" :
    "bg-red-50 dark:bg-red-900/20";

  const showAiOnReview =
    siteAiEnabled && attempt.pastPaper.aiExplanationEnabled !== false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      {/* Header */}
      <Link href="/past-papers" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Past Papers
      </Link>

      <h1 className="mb-2 font-display text-2xl font-bold">{attempt.pastPaper.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        {new Date(attempt.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
      </p>

      {/* Score card */}
      <div className={cn("mb-8 rounded-2xl p-6 text-center", scoreBg)}>
        <div className={cn("font-display text-6xl font-bold mb-2", scoreColor)}>
          {attempt.score}%
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {correct} correct out of {total} questions
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>{attempt.score >= 70 ? "Passed" : attempt.score >= 50 ? "Average" : "Needs work"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{mins}m {secs.toString().padStart(2, "0")}s</span>
          </div>
          {attempt.focusLossCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <span className="text-xs font-medium">
                Tab / window switches recorded: {attempt.focusLossCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Retry button */}
      <div className="mb-8 flex gap-3">
        <Link
          href={`/quiz/${attempt.pastPaper.id}`}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </Link>
        <Link
          href="/past-papers"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          All papers
        </Link>
      </div>

      {/* Review answers */}
      <h2 className="mb-4 font-display text-xl font-semibold">Review Answers</h2>
      <div className="space-y-4">
        {attempt.items.map((item, i) => (
          <QuestionCard
            key={item.id}
            question={item.question as any}
            index={i}
            showResult
            selectedAnswer={item.chosen ?? undefined}
            showAiPanel={showAiOnReview}
            explainPaperId={attempt.pastPaper.id}
          />
        ))}
      </div>
    </div>
  );
}
