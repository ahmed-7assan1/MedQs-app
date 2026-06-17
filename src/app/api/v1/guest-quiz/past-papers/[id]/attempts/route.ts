import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GUEST_QUIZ_COOKIE } from "@/lib/guest-quiz";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params);
  const guestId = _req.cookies.get(GUEST_QUIZ_COOKIE)?.value?.trim();
  if (!guestId)
    return NextResponse.json({ error: "Guest session required" }, { status: 401 });

  const guest = await prisma.guestQuizUser.findUnique({
    where: { id: guestId },
    select: { id: true },
  });
  if (!guest)
    return NextResponse.json({ error: "Invalid guest session" }, { status: 401 });

  const attempts = await prisma.quizAttempt.findMany({
    where: { pastPaperId: id, guestQuizUserId: guest.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      score: true,
      createdAt: true,
      timeTaken: true,
    },
  });

  return NextResponse.json(attempts);
}
