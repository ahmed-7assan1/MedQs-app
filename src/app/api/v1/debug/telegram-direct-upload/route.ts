import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const STORAGE_GROUP_ID = process.env.TELEGRAM_STORAGE_GROUP_ID!;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow large uploads (up to 2GB video)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    // Auth: only admins can upload
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    if (!STORAGE_GROUP_ID) {
      return NextResponse.json({ error: "STORAGE_GROUP_ID not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = (formData as any).get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const caption = `📤 Forum Upload: ${file.name}\n👤 By: ${session.user.name}`;

    console.log(`[TG-UPLOAD] Uploading ${file.name} (${file.type}, ${(buffer.length / 1024 / 1024).toFixed(1)}MB)...`);

    let message: any;
    let fileId: string;

    if (file.type.startsWith("image/")) {
      message = await bot.telegram.sendDocument(STORAGE_GROUP_ID, { source: buffer, filename: file.name }, { caption });
      fileId = message.document.file_id;
    } else if (file.type.startsWith("video/")) {
      message = await bot.telegram.sendVideo(STORAGE_GROUP_ID, { source: buffer, filename: file.name }, { caption });
      fileId = message.video.file_id;
    } else if (file.type.startsWith("audio/")) {
      message = await bot.telegram.sendAudio(STORAGE_GROUP_ID, { source: buffer, filename: file.name }, { caption });
      fileId = message.audio.file_id;
    } else {
      message = await bot.telegram.sendDocument(STORAGE_GROUP_ID, { source: buffer, filename: file.name }, { caption });
      fileId = message.document.file_id;
    }

    const type = file.type.startsWith("video/") ? "video"
      : file.type.startsWith("image/") ? "image"
      : file.type.startsWith("audio/") ? "audio"
      : "file";

    console.log(`[TG-UPLOAD] ✅ Uploaded! messageId=${message.message_id}, fileId=${fileId}`);

    return NextResponse.json({
      success: true,
      messageId: message.message_id,
      chatId: STORAGE_GROUP_ID,
      fileId,
      type,
      fileName: file.name,
    });
  } catch (err: any) {
    console.error("[TG-UPLOAD] Upload failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
