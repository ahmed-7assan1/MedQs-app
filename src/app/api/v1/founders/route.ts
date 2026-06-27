import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const members = await prisma.platformMember.findMany({
      orderBy: { sortOrder: "asc" },
      take: 50,
    });
    return NextResponse.json(members, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  } catch (error) {
    console.error("GET /api/v1/founders error:", error);
    return NextResponse.json({ error: "Failed to fetch founders" }, { status: 500 });
  }
}
