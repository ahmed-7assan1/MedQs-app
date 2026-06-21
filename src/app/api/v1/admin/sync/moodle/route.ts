import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isSuperAdmin } from "@/lib/tenant";

/**
 * POST /api/v1/admin/sync/moodle
 * Body: {
 *   semesterId: string,
 *   modules: Array<{
 *     name: string,
 *     subjects: Array<{
 *       name: string,
 *       lectures: Array<{
 *         title: string,
 *         files: Array<{ name: string, url: string, mimeType: string }>
 *       }>
 *     }>
 *   }>
 * }
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate (Session or Secret Key)
    const syncKey = req.headers.get("x-admin-sync-key");
    const validKey = process.env.ADMIN_SYNC_KEY || "medqs_secret_sync_2026";
    
    let isAuthorized = false;

    if (syncKey === validKey) {
      isAuthorized = true;
    } else {
      const session = await auth();
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        if (user && isAdminRole(user.role)) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { semesterId, modules } = await req.json();

    if (!semesterId || !Array.isArray(modules)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Run in a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      const stats = { modules: 0, subjects: 0, lectures: 0, files: 0 };

      for (const mData of modules) {
        // 1. Find or create the Module
        let mod = await tx.module.findFirst({
          where: { name: mData.name, semesterId }
        });

        if (!mod) {
          mod = await tx.module.create({
            data: { name: mData.name, semesterId }
          });
          stats.modules++;
        }

        // 2. Selective Cleanup: Delete Subjects in this module 
        // (This will cascade delete Lectures and LectureFiles)
        // But importantly, we do NOT delete PastPapers (Quizzes) as they are linked to the Module/Semester
        await tx.subject.deleteMany({
          where: { moduleId: mod.id }
        });

        // 3. Create new structure
        for (const sData of mData.subjects) {
          const subject = await tx.subject.create({
            data: {
              name: sData.name,
              moduleId: mod.id
            }
          });
          stats.subjects++;

          for (const lData of sData.lectures) {
            const lecture = await tx.lecture.create({
              data: {
                title: lData.title,
                subjectId: subject.id,
                order: 0
              }
            });
            stats.lectures++;

            if (lData.files && lData.files.length > 0) {
              await tx.lectureFile.createMany({
                data: lData.files.map((f: any) => ({
                  name: f.name,
                  url: f.url,
                  mimeType: f.mimeType || "application/pdf",
                  lectureId: lecture.id
                }))
              });
              stats.files += lData.files.length;
            }
          }
        }
      }

      return stats;
    });

    return NextResponse.json({ ok: true, stats: result });
  } catch (err) {
    console.error("[moodle-sync-api]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
