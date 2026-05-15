import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rank tiers almost never change — cache for 1 hour to avoid repeated DB hits.
export const dynamic = "force-dynamic";

export async function GET() {
  const ranks = await prisma.rank.findMany({ orderBy: { minPoints: "asc" } });
  return NextResponse.json(ranks);
}
