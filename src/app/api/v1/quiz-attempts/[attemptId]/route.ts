import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      pastPaper: { select: { title: true, timeLimitMin: true } },
      items: {
        include: {
          question: {
            select: {
              id: true, body: true, choices: true,
              answer: true, explanation: true, difficulty: true, lectureId: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Students can only see their own attempts; admins see all
  const role = (session.user as any)?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  if (!isAdmin) {
    if (attempt.guestQuizUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (attempt.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(attempt);
}
