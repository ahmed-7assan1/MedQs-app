import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Record a lecture touchpoint for personalized study assistance.
 * Upserts by (userId, lectureId) and moves timestamp forward.
 */
export async function trackLectureView(userId: string, lectureId: string, source?: string) {
  if (!userId || !lectureId) return;
  const normalizedSource = source?.trim() || null;
  const id = crypto.randomUUID();
  try {
    await prisma.$executeRaw(
      Prisma.sql`
      INSERT INTO "UserLectureActivity" ("id", "userId", "lectureId", "source", "lastViewedAt")
      VALUES (${id}, ${userId}, ${lectureId}, ${normalizedSource}, NOW())
      ON CONFLICT ("userId", "lectureId")
      DO UPDATE SET "source" = EXCLUDED."source", "lastViewedAt" = NOW()
    `
    );
  } catch {
    /* Lecture page must render even if analytics row fails (e.g. migration drift). */
  }
}

