import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
export const dynamic = "force-dynamic";

type Params = { params: { roomId: string; sessionId: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId, sessionId } = params;

  const existing = await prisma.studySession.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });
  if (!existing || existing.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { action } = body;

  if (action === "start") {
    if (existing.startedById !== userId) return NextResponse.json({ error: "Only the host can start" }, { status: 403 });
    if (existing.status !== "WAITING") return NextResponse.json({ error: "Session already started" }, { status: 409 });

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: { status: "ACTIVE", startedAt: new Date() },
      include: {
        startedBy: { select: { id: true, name: true, image: true } },
        participants: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    const room = await prisma.studyRoom.findUnique({ where: { id: roomId }, select: { name: true } });
    const hostUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const hostName = hostUser?.name ?? "Someone";
    const members = await prisma.studyRoomMember.findMany({
      where: { roomId, userId: { not: userId } },
      select: { userId: true },
    });
    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        title: "Session Started! 🔔",
        body: `${hostName} started a study session in ${room?.name ?? "the room"}. Join now!`,
        channel: "SYSTEM" as any,
      })),
    });

    return NextResponse.json(updated);
  }

  if (action === "pause") {
    if (existing.startedById !== userId) return NextResponse.json({ error: "Only the host can pause" }, { status: 403 });
    if (existing.status !== "ACTIVE") return NextResponse.json({ error: "Session is not active" }, { status: 409 });

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: { status: "PAUSED", pausedAt: new Date() },
      include: { participants: { include: { user: { select: { id: true, name: true, image: true } } } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "resume") {
    if (existing.startedById !== userId) return NextResponse.json({ error: "Only the host can resume" }, { status: 403 });
    if (existing.status !== "PAUSED") return NextResponse.json({ error: "Session is not paused" }, { status: 409 });

    const pauseMs = existing.pausedAt ? new Date().getTime() - existing.pausedAt.getTime() : 0;
    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        status: "ACTIVE",
        pausedAt: null,
        totalPauseMs: { increment: pauseMs },
      },
      include: { participants: { include: { user: { select: { id: true, name: true, image: true } } } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "complete") {
    if (existing.startedById !== userId) return NextResponse.json({ error: "Only the host can end" }, { status: 403 });
    if (!["ACTIVE", "PAUSED"].includes(existing.status)) return NextResponse.json({ error: "Invalid status" }, { status: 409 });

    const now = new Date();
    let finalPauseMs = Number(existing.totalPauseMs);
    if (existing.pausedAt) {
      finalPauseMs += now.getTime() - existing.pausedAt.getTime();
    }

    const elapsedMinutes = Math.round((now.getTime() - existing.startedAt.getTime() - finalPauseMs) / 60000);
    const focusSeconds = Math.min(elapsedMinutes * 60, existing.targetDuration * 60);

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        endedAt: now,
        pausedAt: null,
        totalPauseMs: finalPauseMs,
      },
      include: { participants: { include: { user: { select: { id: true, name: true, image: true } } } } },
    });

    await awardPoints(roomId, sessionId, userId, focusSeconds);

    const hostUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const hostName = hostUser?.name ?? "The host";
    const members = await prisma.studyRoomMember.findMany({
      where: { roomId, userId: { not: userId } },
      select: { userId: true },
    });
    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        title: "Session Complete! 🎉",
        body: `${hostName} completed the study session. ${elapsedMinutes} min — well done everyone!`,
        channel: "SYSTEM" as any,
      })),
    });

    return NextResponse.json(updated);
  }

  if (action === "cancel") {
    if (existing.startedById !== userId) return NextResponse.json({ error: "Only the host can cancel" }, { status: 403 });

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED", endedAt: new Date() },
      include: { participants: { include: { user: { select: { id: true, name: true, image: true } } } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "transfer_host") {
    const { newHostId } = body;
    if (!newHostId) return NextResponse.json({ error: "newHostId required" }, { status: 400 });
    if (existing.startedById !== userId) return NextResponse.json({ error: "Only current host can transfer" }, { status: 403 });

    const isParticipant = existing.participants.some((p) => p.userId === newHostId);
    if (!isParticipant) return NextResponse.json({ error: "User is not a participant" }, { status: 400 });

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: { startedById: newHostId },
      include: {
        startedBy: { select: { id: true, name: true, image: true } },
        participants: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });
    return NextResponse.json(updated);
  }

  if (action === "claim_host") {
    const isParticipant = existing.participants.some((p) => p.userId === userId);
    if (!isParticipant) return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    if (existing.status === "CANCELLED" || existing.status === "COMPLETED") return NextResponse.json({ error: "Session ended" }, { status: 400 });

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: { startedById: userId },
      include: {
        startedBy: { select: { id: true, name: true, image: true } },
        participants: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId, sessionId } = params;

  const existing = await prisma.studySession.findUnique({ where: { id: sessionId } });
  if (!existing || existing.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.startedById !== userId) return NextResponse.json({ error: "Only the host can delete" }, { status: 403 });

  await prisma.studySession.delete({ where: { id: sessionId } });
  return NextResponse.json({ ok: true });
}

async function awardPoints(roomId: string, sessionId: string, startedById: string, focusSeconds: number) {
  const basePoints = focusSeconds >= 25 * 60 ? 50 : Math.round((focusSeconds / (25 * 60)) * 50);

  const participants = await prisma.studySessionParticipant.findMany({
    where: { sessionId },
  });

  for (const p of participants) {
    const points = p.userId === startedById ? basePoints + 10 : basePoints;
    await prisma.userPointsTransaction.create({
      data: {
        userId: p.userId,
        roomId,
        reference: sessionId,
        reason: "session_completed",
        points,
      },
    });
    await prisma.user.update({
      where: { id: p.userId },
      data: { points: { increment: points } },
    });
  }
}
