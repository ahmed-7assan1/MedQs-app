import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating } = await req.json();
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const existing = await prisma.customAgentRating.findUnique({
      where: { agentId_userId: { agentId: params.id, userId: session.user.id } },
    });

    if (existing) {
      await prisma.customAgentRating.update({
        where: { id: existing.id },
        data: { rating },
      });
    } else {
      await prisma.customAgentRating.create({
        data: { agentId: params.id, userId: session.user.id, rating },
      });
    }

    const allRatings = await prisma.customAgentRating.findMany({
      where: { agentId: params.id },
    });
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;

    await prisma.customAgent.update({
      where: { id: params.id },
      data: { avgRating: Math.round(avg * 10) / 10, ratingCount: allRatings.length },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to rate agent:", error);
    return NextResponse.json({ error: "Failed to rate" }, { status: 500 });
  }
}
