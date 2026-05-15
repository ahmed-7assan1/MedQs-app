import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  console.log("[auth/me] Session:", session);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  let user = await prisma.user.findUnique({
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
      },
    });
  }

  return NextResponse.json(user, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    }
  });
}
