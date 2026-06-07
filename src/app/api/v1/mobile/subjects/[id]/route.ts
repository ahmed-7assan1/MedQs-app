import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decode } from "next-auth/jwt";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      try {
        const decoded = await decode({ token, secret, salt: "authjs.session-token" });
        if (decoded?.id) {
          userId = decoded.id;
        }
      } catch (e) {
        // decode failed
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjectId = params.id;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        module: { select: { id: true, name: true } },
        lectures: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            videoUrl: true,
            order: true,
            notesMarkdown: true,
            videos: {
              select: {
                id: true,
                telegramMessageId: true,
                telegramChatId: true,
                telegramFileId: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // 🛰️ Transform Telegram video IDs into proxy URLs
    const transformed = {
      ...subject,
      lectures: subject.lectures.map(lec => {
        const tgVideo = lec.videos?.find(v => v.telegramFileId);
        if (tgVideo) {
          const fileIdParam = `?fileId=${encodeURIComponent(tgVideo.telegramFileId)}`;
          return {
            ...lec,
            videoUrl: `/api/v1/telegram/video/${tgVideo.telegramChatId}/${tgVideo.telegramMessageId}${fileIdParam}`,
          };
        }
        return lec;
      })
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Mobile Subject Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
