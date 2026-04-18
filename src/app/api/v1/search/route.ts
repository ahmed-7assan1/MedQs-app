import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// GET /api/v1/search?q= — modules, lectures, quizzes, peers (same university), user by id / studentId
export async function GET(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ users: [], modules: [], lectures: [], quizzes: [] });
  }

  const superUser = isSuperAdmin(scope.role);
  const uniId = scope.universityId;

  if (!superUser && !uniId) {
    return NextResponse.json({ error: "Complete registration (university) to use search." }, { status: 403 });
  }

  const take = 8;
  const contains = { contains: q, mode: "insensitive" as const };

  const users: { id: string; label: string; sub: string; href: string }[] = [];
  const modules: { id: string; label: string; sub: string; href: string }[] = [];
  const lectures: { id: string; label: string; sub: string; href: string }[] = [];
  const quizzes: { id: string; label: string; sub: string; href: string }[] = [];

  // Users: exact id, studentId match, or name contains (scoped)
  if (UUID_RE.test(q)) {
    const u = await prisma.user.findFirst({
      where: {
        id: q,
        ...(superUser ? {} : { universityId: uniId }),
      },
      select: { id: true, name: true, nickname: true, studentId: true },
    });
    if (u) {
      users.push({
        id: u.id,
        label: u.nickname || u.name,
        sub: u.studentId ? `ID ${u.studentId}` : "Student",
        href: `/profile/u/${u.id}`,
      });
    }
  }

  const peerRows = await prisma.user.findMany({
    where: {
      ...(superUser ? {} : { universityId: uniId }),
      NOT: { id: scope.userId },
      OR: [
        { studentId: { equals: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
        { name: contains },
        { nickname: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, nickname: true, studentId: true },
    take,
  });
  for (const u of peerRows) {
    if (users.some((x) => x.id === u.id)) continue;
    users.push({
      id: u.id,
      label: u.nickname || u.name,
      sub: u.studentId ? `ID ${u.studentId}` : "Student",
      href: `/profile/u/${u.id}`,
    });
  }

  const modRows = await prisma.module.findMany({
    where: {
      name: contains,
      ...(superUser
        ? {}
        : {
            semester: { academicYear: { universityId: uniId! } },
          }),
    },
    select: { id: true, name: true },
    take,
  });
  for (const m of modRows) {
    modules.push({ id: m.id, label: m.name, sub: "Module", href: `/modules/${m.id}` });
  }

  const lecRows = await prisma.lecture.findMany({
    where: {
      title: contains,
      ...(superUser
        ? {}
        : {
            subject: { module: { semester: { academicYear: { universityId: uniId! } } } },
          }),
    },
    select: {
      id: true,
      title: true,
      subject: { select: { name: true, module: { select: { id: true, name: true } } } },
    },
    take,
  });
  for (const l of lecRows) {
    const mid = l.subject.module?.id ?? "__none__";
    lectures.push({
      id: l.id,
      label: l.title,
      sub: `${l.subject.module?.name ?? "General"} · ${l.subject.name}`,
      href: `/modules/${mid}/lectures/${l.id}`,
    });
  }

  const paperRows = await prisma.pastPaper.findMany({
    where: {
      title: contains,
      ...(superUser ? {} : { module: { semester: { academicYear: { universityId: uniId! } } } }),
    },
    select: { id: true, title: true, module: { select: { name: true } } },
    take,
  });
  for (const p of paperRows) {
    quizzes.push({
      id: p.id,
      label: p.title,
      sub: p.module?.name ? `Quiz · ${p.module.name}` : "Quiz",
      href: `/quiz/${p.id}`,
    });
  }

  return NextResponse.json({ users, modules, lectures, quizzes });
}
