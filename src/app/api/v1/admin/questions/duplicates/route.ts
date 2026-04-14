import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

export async function GET(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  try {
    // For large DBs, doing this on the DB side via raw SQL is much more efficient, 
    // but Prisma doesn't have a built-in GROUP BY for text normalization.
    // We will fetch questions and group them in JS.
    const questions = await prisma.question.findMany({
      where: w.isSuper ? undefined : { lecture: { subject: { module: { semester: { academicYear: { universityId: w.scope.universityId! } } } } } },
      select: {
        id: true,
        body: true,
        difficulty: true,
        createdAt: true,
        lecture: {
          select: { title: true, subject: { select: { name: true, module: { select: { name: true } } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const groups = new Map<string, typeof questions>();

    const normalize = (text: string) => {
      // Remove spaces, punctuation, lowercase
      return text.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
    };

    questions.forEach((q) => {
      const norm = normalize(q.body);
      if (norm.length < 5) return; // skip very short bodies
      const existing = groups.get(norm) || [];
      existing.push(q);
      groups.set(norm, existing);
    });

    const duplicates = Array.from(groups.values())
      .filter((g) => g.length > 1)
      .map(group => {
        return {
          normalizedKey: normalize(group[0].body),
          originalBody: group[0].body,
          count: group.length,
          questions: group
        };
      })
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ duplicates, totalDuplicateGroups: duplicates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
