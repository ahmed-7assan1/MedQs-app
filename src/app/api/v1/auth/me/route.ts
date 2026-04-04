import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, nickname: true, bio: true, image: true,
      phone: true, phoneVisible: true, theme: true,
      universityId: true, semesterId: true, role: true, points: true, hideRank: true, studentId: true,
      isPrivate: true, instagramUrl: true, facebookUrl: true,
      rank: { select: { label: true, badge: true } },
      university: { select: { name: true } },
      semester: { select: { name: true } },
    },
  });

  return NextResponse.json(user);
}
