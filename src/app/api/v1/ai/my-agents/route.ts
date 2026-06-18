import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agents = await prisma.customAgent.findMany({
      where: { creatorId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Failed to fetch my agents:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
