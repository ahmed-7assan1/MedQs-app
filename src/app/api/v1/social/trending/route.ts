import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 600;

export async function GET(req: NextRequest) {
  try {
    const trending = await prisma.hashtag.findMany({
      orderBy: { count: "desc" },
      take: 8,
      select: { id: true, name: true, count: true }
    });

    return NextResponse.json(trending);
  } catch (error) {
    console.error("[trending-api]", error);
    return NextResponse.json({ error: "Failed to fetch trending tags" }, { status: 500 });
  }
}
