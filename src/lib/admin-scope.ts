import { NextResponse } from "next/server";
import type { AuthSession as Session } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole, isSuperAdmin, type SessionScope } from "@/lib/tenant";

export type AdminWriteResult =
  | { ok: true; scope: SessionScope; isSuper: boolean }
  | { ok: false; response: NextResponse };

/** Admin or super-admin; regular admin must have universityId set. */
export async function requireAdminWriter(session: Session | null): Promise<AdminWriteResult> {
  const scope = await getSessionScope(session);
  if (!scope) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isAdminRole(scope.role)) return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  if (isSuperAdmin(scope.role)) return { ok: true, scope, isSuper: true };
  if (!scope.universityId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin must be assigned to a university" }, { status: 403 }),
    };
  }
  return { ok: true, scope, isSuper: false };
}

function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function assertSameUniversity(scope: SessionScope, universityId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  if (!scope.universityId || scope.universityId !== universityId) return forbidden();
  return null;
}

export async function assertAcademicYear(scope: SessionScope, academicYearId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const y = await prisma.academicYear.findFirst({
    where: { id: academicYearId, universityId: scope.universityId! },
    select: { id: true },
  });
  if (!y) return forbidden();
  return null;
}

export async function assertSemester(scope: SessionScope, semesterId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const s = await prisma.semester.findFirst({
    where: { id: semesterId, academicYear: { universityId: scope.universityId! } },
    select: { id: true },
  });
  if (!s) return forbidden();
  return null;
}

export async function assertModule(scope: SessionScope, moduleId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const m = await prisma.module.findFirst({
    where: { id: moduleId, semester: { academicYear: { universityId: scope.universityId! } } },
    select: { id: true },
  });
  if (!m) return forbidden();
  return null;
}

export async function assertSubject(scope: SessionScope, subjectId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const s = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      module: { semester: { academicYear: { universityId: scope.universityId! } } },
    },
    select: { id: true },
  });
  if (!s) return forbidden();
  return null;
}

export async function assertLecture(scope: SessionScope, lectureId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const l = await prisma.lecture.findFirst({
    where: {
      id: lectureId,
      subject: { module: { semester: { academicYear: { universityId: scope.universityId! } } } },
    },
    select: { id: true },
  });
  if (!l) return forbidden();
  return null;
}

export async function assertPastPaper(scope: SessionScope, pastPaperId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const p = await prisma.pastPaper.findFirst({
    where: {
      id: pastPaperId,
      semester: { academicYear: { universityId: scope.universityId! } },
      module: { semester: { academicYear: { universityId: scope.universityId! } } },
    },
    select: { id: true },
  });
  if (!p) return forbidden();
  return null;
}

export async function assertQuestion(scope: SessionScope, questionId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const q = await prisma.question.findFirst({
    where: {
      id: questionId,
      lecture: { subject: { module: { semester: { academicYear: { universityId: scope.universityId! } } } } },
    },
    select: { id: true },
  });
  if (!q) return forbidden();
  return null;
}

export async function assertFlashcard(scope: SessionScope, flashcardId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const f = await prisma.flashcard.findFirst({
    where: {
      id: flashcardId,
      lecture: { subject: { module: { semester: { academicYear: { universityId: scope.universityId! } } } } },
    },
    select: { id: true },
  });
  if (!f) return forbidden();
  return null;
}

export async function assertForum(scope: SessionScope, forumId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const f = await prisma.forum.findFirst({
    where: { id: forumId, universityId: scope.universityId! },
    select: { id: true },
  });
  if (!f) return forbidden();
  return null;
}

/** Past paper create: semester and module must match and sit under the admin's university. */
export async function assertPastPaperCreatePayload(
  scope: SessionScope,
  semesterId: string,
  moduleId: string
): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const m = await prisma.module.findFirst({
    where: {
      id: moduleId,
      semesterId,
      semester: { academicYear: { universityId: scope.universityId! } },
    },
    select: { id: true },
  });
  if (!m) return forbidden();
  return null;
}

/** Site-wide ads (no university, no semester): super only. Otherwise tenant-bound. */
export async function assertAdBannerPayload(
  scope: SessionScope,
  universityId: string | null | undefined,
  semesterId: string | null | undefined
): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const u = universityId ?? null;
  const s = semesterId ?? null;
  if (u == null && s == null) return forbidden();
  if (u != null && u !== scope.universityId) return forbidden();
  if (s != null) {
    const semErr = await assertSemester(scope, s);
    if (semErr) return semErr;
    if (u != null) {
      const match = await prisma.semester.findFirst({
        where: { id: s, academicYear: { universityId: u } },
        select: { id: true },
      });
      if (!match)
        return NextResponse.json({ error: "Semester does not match university" }, { status: 400 });
    }
  }
  return null;
}

export async function assertLectureIdsInScope(scope: SessionScope, lectureIds: string[]): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const unique = [...new Set(lectureIds.filter(Boolean))];
  if (unique.length === 0) return NextResponse.json({ error: "No lectures" }, { status: 400 });
  const count = await prisma.lecture.count({
    where: {
      id: { in: unique },
      subject: { module: { semester: { academicYear: { universityId: scope.universityId! } } } },
    },
  });
  if (count !== unique.length) return forbidden();
  return null;
}

/** Existing ad row must belong to admin's university (via universityId or semester chain). Site-wide ads: super only. */
export async function assertAdBanner(scope: SessionScope, adId: string): Promise<NextResponse | null> {
  if (isSuperAdmin(scope.role)) return null;
  const ad = await prisma.adBanner.findUnique({
    where: { id: adId },
    select: { universityId: true, semesterId: true },
  });
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ad.universityId) {
    if (ad.universityId === scope.universityId) return null;
    return forbidden();
  }
  if (ad.semesterId) return assertSemester(scope, ad.semesterId);
  return forbidden();
}
