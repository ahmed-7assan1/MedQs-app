import type { Prisma } from "@/generated/prisma";

type Tx = Prisma.TransactionClient;

/** Delete semester and dependent rows (modules → subjects → lectures, forums, past papers, etc.). */
/** Delete past papers tied to this module (and their quiz attempts), then the module. Subjects/lectures cascade via FK. */
export async function deleteModuleCascade(tx: Tx, moduleId: string): Promise<void> {
  const papers = await tx.pastPaper.findMany({ where: { moduleId }, select: { id: true } });
  const paperIds = papers.map((p) => p.id);
  if (paperIds.length > 0) {
    const attempts = await tx.quizAttempt.findMany({
      where: { pastPaperId: { in: paperIds } },
      select: { id: true },
    });
    const attemptIds = attempts.map((a) => a.id);
    if (attemptIds.length > 0) {
      await tx.quizAttemptItem.deleteMany({ where: { attemptId: { in: attemptIds } } });
      await tx.quizAttempt.deleteMany({ where: { id: { in: attemptIds } } });
    }
    await tx.pastPaper.deleteMany({ where: { moduleId } });
  }
  await tx.module.delete({ where: { id: moduleId } });
}

export async function deleteSemesterCascade(tx: Tx, semesterId: string): Promise<void> {
  await tx.user.updateMany({ where: { semesterId }, data: { semesterId: null } });
  await tx.adBanner.updateMany({ where: { semesterId }, data: { semesterId: null } });

  const forums = await tx.forum.findMany({ where: { semesterId }, select: { id: true } });
  const forumIds = forums.map((f) => f.id);
  if (forumIds.length > 0) {
    await tx.post.deleteMany({ where: { forumId: { in: forumIds } } });
    await tx.forum.deleteMany({ where: { id: { in: forumIds } } });
  }

  const papers = await tx.pastPaper.findMany({ where: { semesterId }, select: { id: true } });
  const paperIds = papers.map((p) => p.id);
  if (paperIds.length > 0) {
    const attempts = await tx.quizAttempt.findMany({
      where: { pastPaperId: { in: paperIds } },
      select: { id: true },
    });
    const attemptIds = attempts.map((a) => a.id);
    if (attemptIds.length > 0) {
      await tx.quizAttemptItem.deleteMany({ where: { attemptId: { in: attemptIds } } });
      await tx.quizAttempt.deleteMany({ where: { id: { in: attemptIds } } });
    }
    await tx.pastPaper.deleteMany({ where: { semesterId } });
  }

  await tx.module.deleteMany({ where: { semesterId } });
  await tx.semester.delete({ where: { id: semesterId } });
}

export async function deleteAcademicYearCascade(tx: Tx, academicYearId: string): Promise<void> {
  const semesters = await tx.semester.findMany({
    where: { academicYearId },
    select: { id: true },
  });
  for (const s of semesters) {
    await deleteSemesterCascade(tx, s.id);
  }
  await tx.academicYear.delete({ where: { id: academicYearId } });
}

export async function deleteUniversityCascade(tx: Tx, universityId: string): Promise<void> {
  await tx.adBanner.updateMany({ where: { universityId }, data: { universityId: null } });
  await tx.user.updateMany({ where: { universityId }, data: { universityId: null } });
  await tx.universityYearIdFormat.deleteMany({ where: { universityId } });

  const years = await tx.academicYear.findMany({
    where: { universityId },
    select: { id: true },
  });
  for (const y of years) {
    await deleteAcademicYearCascade(tx, y.id);
  }
  await tx.university.delete({ where: { id: universityId } });
}
