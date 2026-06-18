import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const uid = session.user.id;

    type NotificationItem = {
      type: "quiz_rating" | "quiz_comment" | "flashcard_rating" | "flashcard_comment" | "agent_rating" | "agent_comment";
      itemId: string;
      itemTitle: string;
      actorId: string;
      text: string;
      rating?: number;
      createdAt: string;
    };

    const notifications: NotificationItem[] = [];

    // Quiz ratings on user's published quizzes
    const myQuizIds = (
      await prisma.savedQuiz.findMany({ where: { userId: uid }, select: { id: true, title: true } })
    ).reduce((map, q) => { map.set(q.id, q.title); return map; }, new Map<string, string>());
    if (myQuizIds.size > 0) {
      const ratings = await prisma.quizRating.findMany({
        where: { quizId: { in: [...myQuizIds.keys()] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      for (const r of ratings) {
        notifications.push({
          type: "quiz_rating", itemId: r.quizId, itemTitle: myQuizIds.get(r.quizId) || "",
          actorId: r.userId, text: "", rating: r.rating, createdAt: r.createdAt.toISOString(),
        });
      }
      const comments = await prisma.quizComment.findMany({
        where: { quizId: { in: [...myQuizIds.keys()] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      for (const c of comments) {
        notifications.push({
          type: "quiz_comment", itemId: c.quizId, itemTitle: myQuizIds.get(c.quizId) || "",
          actorId: c.userId, text: c.text, createdAt: c.createdAt.toISOString(),
        });
      }
    }

    // Flashcard set ratings/comments
    const myFcIds = (
      await prisma.savedFlashcardSet.findMany({ where: { userId: uid }, select: { id: true, title: true } })
    ).reduce((map, s) => { map.set(s.id, s.title); return map; }, new Map<string, string>());
    if (myFcIds.size > 0) {
      const ratings = await prisma.flashcardSetRating.findMany({
        where: { flashcardSetId: { in: [...myFcIds.keys()] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      for (const r of ratings) {
        notifications.push({
          type: "flashcard_rating", itemId: r.flashcardSetId, itemTitle: myFcIds.get(r.flashcardSetId) || "",
          actorId: r.userId, text: "", rating: r.rating, createdAt: r.createdAt.toISOString(),
        });
      }
      const comments = await prisma.flashcardSetComment.findMany({
        where: { flashcardSetId: { in: [...myFcIds.keys()] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      for (const c of comments) {
        notifications.push({
          type: "flashcard_comment", itemId: c.flashcardSetId, itemTitle: myFcIds.get(c.flashcardSetId) || "",
          actorId: c.userId, text: c.text, createdAt: c.createdAt.toISOString(),
        });
      }
    }

    // Agent ratings/comments
    const myAgentIds = (
      await prisma.customAgent.findMany({ where: { creatorId: uid }, select: { id: true, name: true } })
    ).reduce((map, a) => { map.set(a.id, a.name); return map; }, new Map<string, string>());
    if (myAgentIds.size > 0) {
      const ratings = await prisma.customAgentRating.findMany({
        where: { agentId: { in: [...myAgentIds.keys()] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      for (const r of ratings) {
        notifications.push({
          type: "agent_rating", itemId: r.agentId, itemTitle: myAgentIds.get(r.agentId) || "",
          actorId: r.userId, text: "", rating: r.rating, createdAt: r.createdAt.toISOString(),
        });
      }
      const comments = await prisma.customAgentComment.findMany({
        where: { agentId: { in: [...myAgentIds.keys()] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      for (const c of comments) {
        notifications.push({
          type: "agent_comment", itemId: c.agentId, itemTitle: myAgentIds.get(c.agentId) || "",
          actorId: c.userId, text: c.text, createdAt: c.createdAt.toISOString(),
        });
      }
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
