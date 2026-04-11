import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyStudyPlanWithMeta } from "@/lib/gemini";
import { aiOptionsFromSiteProvider } from "@/lib/site-ai-options";

function mondayIso(d = new Date()) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const n = new Date(d);
  n.setDate(d.getDate() + diff);
  return n.toISOString().slice(0, 10);
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const site = await prisma.siteConfig.findFirst({ select: { aiPreferredProvider: true } }).catch(() => null);
  const aiOpts = aiOptionsFromSiteProvider(site?.aiPreferredProvider);

  const profile = await prisma.studyAssistantProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Save your profile first (schedule & preferences)." }, { status: 400 });
  }

  const plan = await generateWeeklyStudyPlanWithMeta(
    {
      scheduleText: profile.scheduleText ?? "",
      hobbies: profile.hobbies ?? "",
      dailyStudyMinutes: profile.dailyStudyMinutes,
      worshipMinutes: profile.worshipMinutes,
      otherRoutines: profile.otherRoutines ?? "",
    },
    aiOpts
  );

  const weekStart = mondayIso();
  const updated = await prisma.studyAssistantProfile.update({
    where: { userId: session.user.id },
    data: {
      currentPlanJson: plan.data as object,
      weekStartIso: weekStart,
      progressJson: {},
    },
  });

  return NextResponse.json({
    profile: updated,
    meta: plan.meta,
  });
}
