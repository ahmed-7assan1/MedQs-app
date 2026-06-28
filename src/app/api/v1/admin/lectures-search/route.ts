import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const lectures = await prisma.lecture.findMany({
      where: query ? { title: { contains: query, mode: "insensitive" } } : undefined,
      take: 20,
      select: {
        id: true,
        title: true,
        subject: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ lectures });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
