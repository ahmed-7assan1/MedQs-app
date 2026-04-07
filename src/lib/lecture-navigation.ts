import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function getVideoEmbedInfo(url: string): { embedUrl: string; type: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`, type: "YouTube" };
  const gd = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gd) return { embedUrl: `https://drive.google.com/file/d/${gd[1]}/preview`, type: "Google Drive" };
  if (url.includes("t.me") || url.includes("telegram")) return { embedUrl: url, type: "Telegram" };
  if (url.includes("/embed/") || url.match(/\.(mp4|webm|ogg)$/i)) return { embedUrl: url, type: "Video" };
  return null;
}

/** Lecture must belong to the module in the URL (single query, avoids relation bugs). */
export async function getLectureInModule(moduleId: string, lectureId: string) {
  const lecture = await prisma.lecture.findFirst({
    where: {
      id: lectureId,
      subject: { moduleId },
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          moduleId: true,
          module: { select: { id: true, name: true } },
        },
      },
      flashcards: { orderBy: { id: "asc" } },
      questions: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          imageUrl: true,
          choices: true,
          answer: true,
          explanation: true,
          difficulty: true,
          lectureId: true,
        },
      },
      files: true,
      videos: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!lecture) return null;

  // Prisma client may not be regenerated on Windows; fetch JSON columns via raw SQL.
  const rows = await prisma
    .$queryRaw<Array<{ uiConfig: any; extras: any }>>(
      Prisma.sql`SELECT "uiConfig","extras" FROM "Lecture" WHERE "id" = ${lectureId} LIMIT 1`
    )
    .catch(() => []);
  const uiConfig = rows?.[0]?.uiConfig ?? null;
  const extras = rows?.[0]?.extras ?? null;
  return Object.assign(lecture as any, { uiConfig, extras });
}
