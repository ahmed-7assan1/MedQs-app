import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SharedQuizClient } from "./SharedQuizClient";

interface Props {
  params: { shareCode: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quiz = await prisma.savedQuiz.findUnique({
    where: { shareCode: params.shareCode },
  });

  if (!quiz) {
    return { title: "Quiz Not Found — MedOneX" };
  }

  const title = `MedOneX Quiz — ${quiz.title}`;
  const description = "Interactive AI-powered quiz. Solve and test your knowledge!";
  const ogImage = `https://medonex.vercel.app/api/og/quiz/${params.shareCode}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "MedOneX",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharedQuizPage({ params }: Props) {
  const quiz = await prisma.savedQuiz.findUnique({
    where: { shareCode: params.shareCode },
  });

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Quiz Not Found</h1>
          <p className="text-gray-400">This quiz may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return <SharedQuizClient quiz={{ id: quiz.id, title: quiz.title, questions: quiz.questions as any[], shareCode: quiz.shareCode, source: quiz.source }} />;
}
