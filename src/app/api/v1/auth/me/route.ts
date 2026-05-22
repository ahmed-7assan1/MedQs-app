import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  console.log("[auth/me] Session:", session);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  let user: any = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, nickname: true, bio: true, image: true,
      phone: true, phoneVisible: true, theme: true,
      universityId: true, facultyId: true, semesterId: true, role: true, points: true, hideRank: true, studentId: true,
      isPrivate: true, instagramUrl: true, facebookUrl: true,
      handle: true, coverImage: true, telegramVerified: true, telegramPhone: true,
      rank: { select: { label: true, badge: true } },
      university: { select: { name: true } },
      semester: { select: { name: true } },
      useCustomKey: true,
      personalGeminiKey: true,
      personalOpenAIKey: true,
      personalGroqKey: true,
      personalOpenRouterKey: true,
      personalXAIKey: true,
      personalAnthropicKey: true,
      personalSiliconFlowKey: true,
      personalSiliconFlowModel: true,
      personalSiliconFlowUrl: true,
    },
  });

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, name: true, nickname: true, bio: true, image: true,
        phone: true, phoneVisible: true, theme: true,
        universityId: true, facultyId: true, semesterId: true, role: true, points: true, hideRank: true, studentId: true,
        isPrivate: true, instagramUrl: true, facebookUrl: true,
        handle: true, coverImage: true, telegramVerified: true, telegramPhone: true,
        rank: { select: { label: true, badge: true } },
        university: { select: { name: true } },
        semester: { select: { name: true } },
        useCustomKey: true,
        personalGeminiKey: true,
        personalOpenAIKey: true,
        personalGroqKey: true,
        personalOpenRouterKey: true,
        personalXAIKey: true,
        personalAnthropicKey: true,
        personalSiliconFlowKey: true,
        personalSiliconFlowModel: true,
        personalSiliconFlowUrl: true,
      },
    });
  }

  if (user) {
    user = {
      ...user,
      personalGeminiKey: user.personalGeminiKey ? "••••••••" : null,
      personalOpenAIKey: user.personalOpenAIKey ? "••••••••" : null,
      personalGroqKey: user.personalGroqKey ? "••••••••" : null,
      personalOpenRouterKey: user.personalOpenRouterKey ? "••••••••" : null,
      personalXAIKey: user.personalXAIKey ? "••••••••" : null,
      personalAnthropicKey: user.personalAnthropicKey ? "••••••••" : null,
      personalSiliconFlowKey: user.personalSiliconFlowKey ? "••••••••" : null,
    };
  }

  return NextResponse.json(user, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    }
  });
}
