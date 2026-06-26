import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.$queryRaw<
      Array<{ id: string; name: string; image: string }>
    >`SELECT id, name, image FROM "User" WHERE image IS NOT NULL ORDER BY RANDOM() LIMIT 4`;

    return NextResponse.json(users);
  } catch {
    return NextResponse.json([]);
  }
}
