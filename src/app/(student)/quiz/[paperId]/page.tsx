import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { QuizSkeleton } from "@/components/ui/skeletons";

const QuizClient = dynamic(
  () => import("@/components/quiz/QuizClient").then((m) => ({ default: m.QuizClient })),
  { loading: () => <QuizSkeleton />, ssr: false }
);

export default async function QuizPage({ params }: { params: { paperId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const paper = await prisma.pastPaper.findUnique({
    where: { id: params.paperId },
    include: {
      module: {
        include: {
          subjects: {
            include: {
              lectures: {
                include: {
                  questions: {
                    select: {
                      id: true, body: true, imageUrl: true, choices: true,
                      answer: true, explanation: true, difficulty: true, lectureId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!paper) notFound();

  const siteConfig = await prisma.siteConfig
    .findFirst({ select: { enableAI: true } })
    .catch(() => null);
  const siteAiEnabled = siteConfig?.enableAI !== false;

  // Flatten all questions from all lectures in this module
  const questions = paper.module.subjects
    .flatMap((s) => s.lectures)
    .flatMap((l) => l.questions);

  // Shuffle questions for variety
  const shuffled = questions.sort(() => Math.random() - 0.5);

  return (
    <QuizClient
      paperId={paper.id}
      paperTitle={paper.title}
      timeLimitMin={paper.timeLimitMin}
      questions={shuffled as any}
      siteAiEnabled={siteAiEnabled}
      paperAiExplanationEnabled={paper.aiExplanationEnabled !== false}
      allowAiDuringQuiz={paper.allowAiDuringQuiz === true}
    />
  );
}
