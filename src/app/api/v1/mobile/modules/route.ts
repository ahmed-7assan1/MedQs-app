import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decode } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId = null;
    let semesterId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      try {
        const decoded = await decode({ token, secret, salt: "authjs.session-token" });
        if (decoded?.id) {
          userId = decoded.id as string;
          semesterId = decoded.semesterId as string | null;
        }
      } catch (e) {
        console.error("Token decode error:", e);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If semesterId is not in token, fetch it
    if (!semesterId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { semesterId: true } });
      semesterId = user?.semesterId;
    }

    let where: any = {};
    if (semesterId) {
      where = { semesterId };
    }

    // Fetch full curriculum tree
    const modules = await prisma.module.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        subjects: {
          orderBy: { name: 'asc' },
          include: {
            lectures: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                videoUrl: true,
                order: true,
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
        }
      }
    });

    // 🛰️ Transform Telegram video IDs into proxy URLs for each lecture
    const transformed = modules.map(mod => ({
      ...mod,
      subjects: mod.subjects.map(sub => ({
        ...sub,
        lectures: sub.lectures.map(lec => {
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
      }))
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Mobile Modules Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
