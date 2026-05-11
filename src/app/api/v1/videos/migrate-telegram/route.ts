import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * 🛰️ Telegram Migration Endpoint
 * Called by Colab script after uploading a video to Telegram.
 * Updates LectureVideo record with Telegram metadata and sets sourceType = 'telegram'.
 *
 * Auth: Protected by TELEGRAM_BOT_TOKEN header.
 */

// ─── POST: Update a single video after Telegram upload ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const botToken = req.headers.get("x-bot-token");
    if (!botToken || botToken !== process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, telegramMessageId, telegramChatId, telegramFileId } = body;

    if (!videoId || !telegramMessageId || !telegramChatId) {
      return NextResponse.json(
        { error: "Missing required fields: videoId, telegramMessageId, telegramChatId" },
        { status: 400 }
      );
    }

    // Update LectureVideo record
    const updated = await (prisma as any).lectureVideo.update({
      where: { id: videoId },
      data: {
        telegramMessageId: parseInt(String(telegramMessageId)),
        telegramChatId:    String(telegramChatId),
        telegramFileId:    telegramFileId ? String(telegramFileId) : undefined,
        sourceType:        "telegram",
        isBroadcasted:     true,
        updatedAt:         new Date(),
      },
      select: {
        id:               true,
        title:            true,
        sourceType:       true,
        telegramMessageId: true,
        telegramChatId:   true,
        telegramFileId:   true,
        lectureId:        true,
      },
    });

    // Also clear Lecture.videoUrl if it was a YouTube link
    await (prisma as any).lecture.updateMany({
      where: {
        id: updated.lectureId,
        videoUrl: { contains: "youtube" },
      },
      data: { videoUrl: null },
    });

    return NextResponse.json({
      success:  true,
      video:    updated,
      message:  `Video "${updated.title}" updated to Telegram source`,
    });

  } catch (error: any) {
    console.error("[migrate-telegram] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── GET: Fetch all YouTube videos pending migration ─────────────────────────
export async function GET(req: NextRequest) {
  try {
    const botToken = req.headers.get("x-bot-token");
    if (!botToken || botToken !== process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get("semesterId") || undefined;
    const limit      = parseInt(searchParams.get("limit") || "0");

    // Build filter
    const where: any = {
      OR: [
        { url: { contains: "youtube.com" } },
        { url: { contains: "youtu.be"    } },
      ],
      AND: [
        {
          OR: [
            { telegramFileId: null },
            { telegramFileId: ""   },
          ],
        },
      ],
    };

    if (semesterId) {
      where.lecture = {
        subject: {
          OR: [
            { semesterId },
            { module: { semesterId } },
          ],
        },
      };
    }

    const videos = await (prisma as any).lectureVideo.findMany({
      where,
      take: limit > 0 ? limit : undefined,
      orderBy: [{ lecture: { subject: { name: "asc" } } }, { sortOrder: "asc" }],
      select: {
        id:        true,
        title:     true,
        url:       true,
        sourceType: true,
        lectureId:  true,
        lecture: {
          select: {
            id:    true,
            title: true,
            order: true,
            subject: {
              select: {
                id:   true,
                name: true,
                module: {
                  select: {
                    id:   true,
                    name: true,
                    semester: {
                      select: {
                        id:   true,
                        name: true,
                        academicYear: {
                          select: {
                            yearNumber: true,
                            university: {
                              select: { id: true, name: true, abbr: true }
                            },
                            faculty: {
                              select: { id: true, name: true }
                            },
                          },
                        },
                      },
                    },
                  },
                },
                semester: {
                  select: {
                    id:   true,
                    name: true,
                    academicYear: {
                      select: {
                        yearNumber: true,
                        university: {
                          select: { id: true, name: true, abbr: true }
                        },
                        faculty: {
                          select: { id: true, name: true }
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Flatten the nested structure for Colab
    const flattened = videos.map((v: any) => {
      const subjectSem = v.lecture?.subject?.semester || v.lecture?.subject?.module?.semester;
      const ay         = subjectSem?.academicYear;
      return {
        video_id:        v.id,
        video_title:     v.title,
        video_url:       v.url,
        source_type:     v.sourceType,
        lecture_id:      v.lectureId,
        lecture_title:   v.lecture?.title,
        subject_id:      v.lecture?.subject?.id,
        subject_name:    v.lecture?.subject?.name,
        module_name:     v.lecture?.subject?.module?.name,
        semester_id:     subjectSem?.id,
        semester_name:   subjectSem?.name,
        year_number:     ay?.yearNumber,
        university_id:   ay?.university?.id,
        university_name: ay?.university?.name,
        university_abbr: ay?.university?.abbr,
        faculty_name:    ay?.faculty?.name,
      };
    });

    return NextResponse.json({
      total:  flattened.length,
      videos: flattened,
    });

  } catch (error: any) {
    console.error("[migrate-telegram] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PATCH: Bulk status check / reset ────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const botToken = req.headers.get("x-bot-token");
    if (!botToken || botToken !== process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Stats summary
    const [total, migrated, pending] = await Promise.all([
      (prisma as any).lectureVideo.count(),
      (prisma as any).lectureVideo.count({
        where: { sourceType: "telegram", telegramFileId: { not: null } },
      }),
      (prisma as any).lectureVideo.count({
        where: {
          OR: [{ url: { contains: "youtube.com" } }, { url: { contains: "youtu.be" } }],
          telegramFileId: null,
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        total,
        migrated,
        pending,
        percentComplete: total > 0 ? Math.round((migrated / total) * 100) : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
