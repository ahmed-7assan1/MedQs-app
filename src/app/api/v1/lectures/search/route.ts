import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ lecture: null });
  }

  const lecture = await prisma.lecture.findFirst({
    where: { title: { contains: q, mode: "insensitive" } },
    select: { id: true, title: true, notesMarkdown: true },
  });

  if (!lecture) {
    return NextResponse.json({ lecture: null });
  }

  return NextResponse.json({
    id: lecture.id,
    title: lecture.title,
    content: lecture.notesMarkdown ?? lecture.title,
  });
}
