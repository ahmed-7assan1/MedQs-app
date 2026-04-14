import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { GUEST_QUIZ_COOKIE } from "@/lib/guest-quiz";
import { GuestIdentifyForm } from "./GuestIdentifyForm";
import { FileText, Clock, BarChart3, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaperList } from "@/components/guest/PaperList";

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
    select: { pastPaperId: true, score: true, id: true, createdAt: true },
  });

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
        <PaperList papers={papers} allAttempts={attempts} />
      )}
    </div>
  );
}
