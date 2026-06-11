import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateStudyWeekReviewWithMeta } from "@/lib/gemini";
import { aiOptionsFromSiteProvider } from "@/lib/site-ai-options";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { getSiteConfig: getCfg } = await import("@/lib/get-site-config");
  const site = await getCfg().catch(() => null);
  const aiOpts = aiOptionsFromSiteProvider(site?.aiPreferredProvider);

  const profile = await prisma.studyAssistantProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile?.currentPlanJson) {
    return NextResponse.json({ error: "Generate a weekly plan first." }, { status: 400 });
  }

  const review = await generateStudyWeekReviewWithMeta(
    {
      planJson: JSON.stringify(profile.currentPlanJson),
      progressJson: JSON.stringify(profile.progressJson ?? {}),
    },
    aiOpts
  );

  return NextResponse.json(review.data);
}
