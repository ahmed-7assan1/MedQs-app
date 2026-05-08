import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const STORAGE_GROUP_ID = process.env.TELEGRAM_STORAGE_GROUP_ID;

// Increase limits for larger files
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!STORAGE_GROUP_ID) {
    return NextResponse.json({ error: "STORAGE_GROUP_ID not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    console.log(`[DEBUG-TG] Directly uploading ${file.name} to Telegram...`);

    let message: any;
    if (file.type.startsWith('image/')) {
      message = await bot.telegram.sendPhoto(STORAGE_GROUP_ID, { source: buffer }, { caption: `DEBUG DIRECT: ${file.name}` });
    } else {
      message = await bot.telegram.sendDocument(STORAGE_GROUP_ID, { source: buffer, filename: file.name }, { caption: `DEBUG DIRECT: ${file.name}` });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: message.message_id,
      fileId: message.document?.file_id || message.photo?.[message.photo.length - 1]?.file_id
    });
  } catch (err: any) {
    console.error("[DEBUG-TG] Direct upload failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
