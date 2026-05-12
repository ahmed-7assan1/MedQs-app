import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadQuestionsForPastPaper } from "@/lib/past-paper-quiz";
import { notFound, redirect } from "next/navigation";
import { QuizSkeleton } from "@/components/ui/skeletons";

const QuizClient = dynamic(
  () => import("@/components/quiz/QuizClient").then((m) => ({ default: m.QuizClient })),
  { loading: () => <QuizSkeleton />, ssr: false }
);

import { unstable_cache } from "next/cache";

const getCachedPaper = (paperId: string) => 
  unstable_cache(
    () => prisma.pastPaper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        timeLimitMin: true,
        aiExplanationEnabled: true,
        allowAiDuringQuiz: true,
        secureExamMode: true,
        restrictCopyPaste: true,
        trackFocusLoss: true,
        // @ts-ignore
        isPrivate: true,
        // @ts-ignore
        randomizeQuestions: true,
      },
    }),
    [`paper-meta-${paperId}`],
    { revalidate: 3600 }
  )();

const getCachedSiteConfig = unstable_cache(
  () => prisma.siteConfig.findFirst({ select: { enableAI: true } }),
  ["site-config-quiz"],
  { revalidate: 3600 }
);

export default async function QuizPage({ params }: { params: { paperId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [paper, siteConfig] = await Promise.all([
    getCachedPaper(params.paperId),
    getCachedSiteConfig()
  ]);

  if (!paper) notFound();
  // @ts-ignore
  if (paper.isPrivate && session.user?.role === "STUDENT") {
    notFound();
  }

  const siteAiEnabled = siteConfig?.enableAI !== false;

  const questions = await loadQuestionsForPastPaper(paper.id);
  // @ts-ignore
  const displayQuestions = paper.randomizeQuestions ? [...questions].sort(() => Math.random() - 0.5) : questions;

  return (
    <QuizClient
      paperId={paper.id}
      paperTitle={paper.title}
      timeLimitMin={paper.timeLimitMin}
      questions={displayQuestions as any}
      siteAiEnabled={siteAiEnabled}
      paperAiExplanationEnabled={paper.aiExplanationEnabled !== false}
      allowAiDuringQuiz={paper.allowAiDuringQuiz === true}
      secureExamMode={paper.secureExamMode === true}
      restrictCopyPaste={paper.restrictCopyPaste === true}
      trackFocusLoss={paper.trackFocusLoss === true}
      currentUserId={session.user.id}
    />
  );
}
