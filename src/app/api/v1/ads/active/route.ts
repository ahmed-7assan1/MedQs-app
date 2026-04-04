import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(null);

  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get("semesterId");

  const ad = await prisma.adBanner.findFirst({
    where: {
      active: true,
      OR: [
        { semesterId: semesterId ?? undefined },
        { semesterId: null }, // global ads
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ad);
}
