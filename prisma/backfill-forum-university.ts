import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const fallbackUni = await prisma.university.findFirst({ select: { id: true } });
  const fallbackUniversityId = fallbackUni?.id ?? null;

  const forums = await prisma.forum.findMany({
    select: { id: true, type: true, semesterId: true, createdBy: true, universityId: true },
  });

  let updated = 0;
  for (const f of forums) {
    if (f.universityId) continue;

    // 1) If semesterId exists, infer university via Semester -> AcademicYear -> University
    let uniId: string | null = null;
    if (f.semesterId) {
      const sem = await prisma.semester.findUnique({
        where: { id: f.semesterId },
        select: { academicYear: { select: { universityId: true } } },
      });
      uniId = sem?.academicYear.universityId ?? null;
    }

    // 2) Fallback: infer from creator user university
    if (!uniId && f.createdBy) {
      const u = await prisma.user.findUnique({ where: { id: f.createdBy }, select: { universityId: true } });
      uniId = u?.universityId ?? null;
    }

    if (!uniId) uniId = fallbackUniversityId;
    if (!uniId) continue;
    await prisma.forum.update({ where: { id: f.id }, data: { universityId: uniId } });
    updated++;
  }

  // Backfill posts
  const posts = await prisma.post.findMany({
    select: { id: true, authorId: true, forumId: true, universityId: true },
  });
  let postsUpdated = 0;
  for (const p of posts) {
    if (p.universityId) continue;
    // Prefer forum universityId
    const forum = await prisma.forum.findUnique({ where: { id: p.forumId }, select: { universityId: true, semesterId: true } });
    let uniId = forum?.universityId ?? null;
    if (!uniId && forum?.semesterId) {
      const sem = await prisma.semester.findUnique({
        where: { id: forum.semesterId },
        select: { academicYear: { select: { universityId: true } } },
      });
      uniId = sem?.academicYear.universityId ?? null;
    }
    // Fallback author university
    if (!uniId) {
      const u = await prisma.user.findUnique({ where: { id: p.authorId }, select: { universityId: true } });
      uniId = u?.universityId ?? null;
    }
    if (!uniId) uniId = fallbackUniversityId;
    if (!uniId) continue;
    await prisma.post.update({ where: { id: p.id }, data: { universityId: uniId } });
    postsUpdated++;
  }

  // Backfill comments
  const comments = await prisma.comment.findMany({ select: { id: true, postId: true, authorId: true, universityId: true } });
  let commentsUpdated = 0;
  for (const c of comments) {
    if (c.universityId) continue;
    const post = await prisma.post.findUnique({ where: { id: c.postId }, select: { universityId: true, authorId: true } });
    let uniId = post?.universityId ?? null;
    if (!uniId) {
      const u = await prisma.user.findUnique({ where: { id: c.authorId }, select: { universityId: true } });
      uniId = u?.universityId ?? null;
    }
    if (!uniId) uniId = fallbackUniversityId;
    if (!uniId) continue;
    await prisma.comment.update({ where: { id: c.id }, data: { universityId: uniId } });
    commentsUpdated++;
  }

  console.log(`Backfill done. Forums updated: ${updated}, posts updated: ${postsUpdated}, comments updated: ${commentsUpdated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

