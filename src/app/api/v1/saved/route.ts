import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await prisma.userSavedItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const moduleIds = items.filter((i) => i.itemType === "MODULE").map((i) => i.itemId);
    const subjectIds = items.filter((i) => i.itemType === "SUBJECT").map((i) => i.itemId);
    const lectureIds = items.filter((i) => i.itemType === "LECTURE").map((i) => i.itemId);

    const [modules, subjects, lectures] = await Promise.all([
      moduleIds.length
        ? prisma.module.findMany({
            where: { id: { in: moduleIds } },
            select: {
              id: true,
              name: true,
              semester: { select: { name: true } },
              subjects: {
                select: { _count: { select: { lectures: true } }, lectures: { select: { questions: { select: { difficulty: true } } } } },
              },
            },
          })
        : Promise.resolve([]),
      subjectIds.length
        ? prisma.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, name: true, module: { select: { name: true } } },
          })
        : Promise.resolve([]),
      lectureIds.length
        ? prisma.lecture.findMany({
            where: { id: { in: lectureIds } },
            select: { id: true, title: true, subject: { select: { name: true, module: { select: { name: true } } } } },
          })
        : Promise.resolve([]),
    ]);

    const grouped = [
      ...modules.map((m) => ({
        id: m.id,
        type: "MODULE" as const,
        title: m.name,
        subtitle: m.semester?.name ?? "",
        lecturesCount: m.subjects.reduce((a, s) => a + s._count.lectures, 0),
      })),
      ...subjects.map((s) => ({
        id: s.id,
        type: "SUBJECT" as const,
        title: s.name,
        subtitle: s.module?.name ?? "",
      })),
      ...lectures.map((l) => ({
        id: l.id,
        type: "LECTURE" as const,
        title: l.title,
        subtitle: l.subject?.module?.name
          ? `${l.subject.module.name} / ${l.subject.name}`
          : l.subject?.name ?? "",
      })),
    ];

    return NextResponse.json({ items: grouped, raw: items });
  } catch (error) {
    console.error("[SAVED_GET]", error);
    return NextResponse.json({ error: "Failed to fetch saved items" }, { status: 500 });
  }
}
