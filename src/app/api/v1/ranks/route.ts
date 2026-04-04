import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ranks = await prisma.rank.findMany({ orderBy: { minPoints: "asc" } });
  return NextResponse.json(ranks);
}
