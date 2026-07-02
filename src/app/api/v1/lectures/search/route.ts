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
    return NextResponse.json({ lectures: [] });
  }

  interface LecRow {
    id: string;
    title: string;
    content: string;
  }
  let lectures: LecRow[] = [];
  try {
    lectures = await prisma.$queryRawUnsafe<LecRow[]>(
      `SELECT l.id, l.title, 
              COALESCE(l."extractedText", l."notesMarkdown", l.title) AS content
       FROM "Lecture" l
       WHERE l."searchVector" @@ plainto_tsquery('arabic', $1)
          OR l.title ILIKE $2
       ORDER BY ts_rank(l."searchVector", plainto_tsquery('arabic', $1)) DESC
       LIMIT 5`,
      q,
      `%${q}%`,
    );
  } catch {
    // fallback
  }

  if (lectures.length === 0) {
    const fallback = await prisma.lecture.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true, notesMarkdown: true },
      take: 5,
    });
    lectures = fallback.map((l) => ({
      id: l.id,
      title: l.title,
      content: l.notesMarkdown ?? l.title,
    }));
  }

  if (lectures.length === 0) {
    return NextResponse.json({ lectures: [] });
  }

  return NextResponse.json(lectures[0]);
}
