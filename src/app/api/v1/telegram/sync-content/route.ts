import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 🛰️ Specialized Endpoint for Colab Sync
 * Protected by TELEGRAM_BOT_TOKEN to ensure only your bot/script can access it.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get("semesterId");
    const botToken = req.headers.get("x-bot-token");

    // 1. Security Check
    if (!botToken || botToken !== process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Unauthorized: Invalid Bot Token" }, { status: 401 });
    }

    if (!semesterId) {
      return NextResponse.json({ error: "semesterId is required" }, { status: 400 });
    }

    // 2. Fetch Deeply Nested Content (Module -> Subject -> Lecture -> Files/Videos)
    const modules = await prisma.module.findMany({
      where: { semesterId },
      orderBy: { name: 'asc' },
      include: {
        subjects: {
          orderBy: { name: 'asc' },
          include: {
            lectures: {
              orderBy: { order: 'asc' },
              include: {
                files: true,
                videos: true,
                records: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ modules }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error: any) {
    console.error("Sync Content Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 📥 Save Telegram File IDs from Colab
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, id, telegramMessageId, telegramChatId, botToken } = body;

    // Security Check
    if (!botToken || botToken !== process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = { 
      telegramMessageId: parseInt(telegramMessageId), 
      telegramChatId: telegramChatId.toString() 
    };

    if (type === 'file') {
      await (prisma.lectureFile as any).update({ where: { id }, data });
    } else if (type === 'video') {
      await (prisma.lectureVideo as any).update({ where: { id }, data });
    } else if (type === 'record') {
      await (prisma.lectureRecord as any).update({ where: { id }, data });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
