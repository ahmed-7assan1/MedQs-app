import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  try {
    const { questions } = await req.json();
    if (!Array.isArray(questions)) return NextResponse.json({ error: "Invalid data format" }, { status: 400 });

    const allMatches = await prisma.question.findMany({
      where: w.isSuper ? undefined : { lecture: { subject: { module: { semester: { academicYear: { universityId: w.scope.universityId! } } } } } },
      select: { body: true }
    });

    const normalizedDB = allMatches.map(m => m.body.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase()).filter(n => n.length > 5);

    const results = questions.map((bodyStr: string) => {
        if (!bodyStr || bodyStr.trim() === "") return false;
        const normalized = bodyStr.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        if (normalized.length < 5) return false;
        
        return normalizedDB.some(n => n.includes(normalized) || normalized.includes(n));
    });

    return NextResponse.json({ duplicates: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
