import nextDynamic from "next/dynamic";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { loadQuestionsForPastPaper } from "@/lib/past-paper-quiz";
import { notFound, redirect } from "next/navigation";
import { QuizSkeleton } from "@/components/ui/skeletons";
import { GUEST_QUIZ_COOKIE } from "@/lib/guest-quiz";

const QuizClient = nextDynamic(
  () => import("@/components/quiz/QuizClient").then((m) => ({ default: m.QuizClient })),
  { loading: () => <QuizSkeleton />, ssr: false }
);

export const dynamic = "force-dynamic";

export default async function GuestQuizPage({ params }: { params: { paperId: string } }) {
  const guestId = (await cookies()).get(GUEST_QUIZ_COOKIE)?.value?.trim();
  if (!guestId) redirect("/guest/past-papers");

  const okGuest = await prisma.guestQuizUser.findUnique({ where: { id: guestId }, select: { id: true } });
  if (!okGuest) redirect("/guest/past-papers");

  const paper = await prisma.pastPaper.findUnique({
    where: { id: params.paperId },
    select: {
      id: true,
      title: true,
      timeLimitMin: true,
      aiExplanationEnabled: true,
      allowAiDuringQuiz: true,
      secureExamMode: true,
      restrictCopyPaste: true,
      trackFocusLoss: true,
    },
  });

  if (!paper) notFound();

  const questions = await loadQuestionsForPastPaper(paper.id);
  const shuffled = [...questions].sort(() => Math.random() - 0.5);

  return (
    <QuizClient
      paperId={paper.id}
      paperTitle={paper.title}
      timeLimitMin={paper.timeLimitMin}
      questions={shuffled as any}
      siteAiEnabled={false}
      paperAiExplanationEnabled={false}
      allowAiDuringQuiz={false}
      secureExamMode={paper.secureExamMode === true}
      restrictCopyPaste={paper.restrictCopyPaste === true}
      trackFocusLoss={paper.trackFocusLoss === true}
      guestQuiz
    />
  );
}
