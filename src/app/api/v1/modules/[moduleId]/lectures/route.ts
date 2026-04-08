import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertModule, requireAdminWriter } from "@/lib/admin-scope";

/** List lectures in a module (for quiz creator / admin). */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ moduleId: string }> | { moduleId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { moduleId } = await Promise.resolve(ctx.params);
  const boundary = await assertModule(w.scope, moduleId);
  if (boundary) return boundary;

  const lectures = await prisma.lecture.findMany({
    where: { subject: { moduleId } },
    orderBy: [{ subjectId: "asc" }, { order: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      order: true,
      subject: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    lectures.map((l) => ({
      id: l.id,
      title: l.title,
      order: l.order,
      subjectId: l.subject.id,
      subjectName: l.subject.name,
    }))
  );
}
