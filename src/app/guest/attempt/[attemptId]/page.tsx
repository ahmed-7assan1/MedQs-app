import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ArrowLeft, Trophy, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GUEST_QUIZ_COOKIE } from "@/lib/guest-quiz";
import { parseEssayGrade } from "@/lib/essay-grade";

export const dynamic = "force-dynamic";

export default async function GuestAttemptResultPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const guestId = (await cookies()).get(GUEST_QUIZ_COOKIE)?.value?.trim();
  if (!guestId) redirect("/guest/past-papers");

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
              questionType: true,
              essayReference: true,
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
  if (attempt.guestQuizUserId !== guestId) redirect("/guest/past-papers");

  const correct = attempt.items.filter((i) => i.isCorrect).length;
  const total = attempt.items.length;
  const mins = Math.floor(attempt.timeTaken / 60);
  const secs = attempt.timeTaken % 60;

  const scoreColor =
    attempt.score >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : attempt.score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-500";

  const scoreBg =
    attempt.score >= 70
      ? "bg-emerald-50 dark:bg-emerald-900/20"
      : attempt.score >= 50
        ? "bg-amber-50 dark:bg-amber-900/20"
        : "bg-red-50 dark:bg-red-900/20";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/guest/past-papers"
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to quizzes
      </Link>

      <h1 className="mb-2 font-display text-2xl font-bold">{attempt.pastPaper.title}</h1>
      <p className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        {new Date(attempt.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
      </p>

      <div className={cn("mb-8 rounded-2xl p-6 text-center", scoreBg)}>
        <div className={cn("font-display mb-2 text-6xl font-bold", scoreColor)}>{attempt.score}%</div>
        <p className="mb-4 text-sm text-muted-foreground">
          {correct} pass on rubric • {total} questions • Essays use partial credit in the % score
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>
              {attempt.score >= 70 ? "Passed" : attempt.score >= 50 ? "Average" : "Needs work"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              {mins}m {secs.toString().padStart(2, "0")}s
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 flex gap-3">
        <Link
          href={`/guest/quiz/${attempt.pastPaper.id}`}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </Link>
        <Link
          href="/guest/past-papers"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          All quizzes
        </Link>
      </div>

      <h2 className="mb-4 font-display text-xl font-semibold">Review answers</h2>
      <div className="space-y-4">
        {attempt.items.map((item, i) => (
          <QuestionCard
            key={item.id}
            question={item.question as any}
            index={i}
            showResult
            selectedAnswer={item.chosen ?? undefined}
            essayReview={parseEssayGrade(item.essayGrade)}
            showAiPanel={false}
            explainPaperId={attempt.pastPaper.id}
          />
        ))}
      </div>
    </div>
  );
}
