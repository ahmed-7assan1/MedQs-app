import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profile = await prisma.studyAssistantProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    profile = await prisma.studyAssistantProfile.create({
      data: { userId: session.user.id },
    });
  }

  const recentQuizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      score: true,
      createdAt: true,
      pastPaper: {
        select: {
          title: true,
          module: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ ...profile, recentQuizAttempts });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const existing = await prisma.studyAssistantProfile.findUnique({
    where: { userId: session.user.id },
  });

  const data: Prisma.StudyAssistantProfileUpdateInput = {};

  if (typeof body.scheduleText === "string") data.scheduleText = body.scheduleText;
  if (typeof body.hobbies === "string") data.hobbies = body.hobbies;
  if (typeof body.otherRoutines === "string") data.otherRoutines = body.otherRoutines;
  if (typeof body.dailyStudyMinutes === "number" && Number.isFinite(body.dailyStudyMinutes)) {
    data.dailyStudyMinutes = Math.max(30, Math.min(720, Math.floor(body.dailyStudyMinutes)));
  }
  if (typeof body.worshipMinutes === "number" && Number.isFinite(body.worshipMinutes)) {
    data.worshipMinutes = Math.max(0, Math.min(240, Math.floor(body.worshipMinutes)));
  }
  if (body.progressJson && typeof body.progressJson === "object" && !Array.isArray(body.progressJson)) {
    data.progressJson = body.progressJson as Prisma.InputJsonValue;
  }
  if (body.currentPlanJson !== undefined) {
    data.currentPlanJson = body.currentPlanJson as Prisma.InputJsonValue;
  }
  if (typeof body.weekStartIso === "string") data.weekStartIso = body.weekStartIso.slice(0, 16);

  if (!existing) {
    const created = await prisma.studyAssistantProfile.create({
      data: {
        userId: session.user.id,
        scheduleText: typeof body.scheduleText === "string" ? body.scheduleText : null,
        hobbies: typeof body.hobbies === "string" ? body.hobbies : null,
        otherRoutines: typeof body.otherRoutines === "string" ? body.otherRoutines : null,
        dailyStudyMinutes:
          typeof body.dailyStudyMinutes === "number" && Number.isFinite(body.dailyStudyMinutes)
            ? Math.max(30, Math.min(720, Math.floor(body.dailyStudyMinutes)))
            : 120,
        worshipMinutes:
          typeof body.worshipMinutes === "number" && Number.isFinite(body.worshipMinutes)
            ? Math.max(0, Math.min(240, Math.floor(body.worshipMinutes)))
            : 30,
        progressJson:
          body.progressJson && typeof body.progressJson === "object" && !Array.isArray(body.progressJson)
            ? (body.progressJson as Prisma.InputJsonValue)
            : undefined,
        currentPlanJson: body.currentPlanJson !== undefined ? (body.currentPlanJson as Prisma.InputJsonValue) : undefined,
        weekStartIso: typeof body.weekStartIso === "string" ? body.weekStartIso.slice(0, 16) : null,
      },
    });
    return NextResponse.json(created);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(existing);
  }

  const updated = await prisma.studyAssistantProfile.update({
    where: { userId: session.user.id },
    data,
  });
  return NextResponse.json(updated);
}
