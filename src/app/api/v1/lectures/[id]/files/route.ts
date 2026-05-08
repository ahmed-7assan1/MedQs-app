import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { syncFileToTelegram } from "@/lib/telegram-storage";

// POST /api/v1/lectures/:id/files  (multipart/form-data, field "file")
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  const form = await req.formData() as any;
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.lecture.includes(file.type))
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE.lecture)
    return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, key } = await uploadFile(buffer, file.name, file.type, "lecture");

  // Sync to Telegram
  const tgSync = await syncFileToTelegram(url, file.name, file.type);

  // If synced to Telegram successfully, we can delete from primary storage to save space
  if (tgSync?.fileId) {
    const { deleteFile } = await import("@/lib/storage");
    await deleteFile(key).catch(err => console.error("[STORAGE] Cleanup failed:", err));
  }

  const lectureFile = await prisma.lectureFile.create({
    data: {
      lectureId: id,
      name: file.name,
      url, // We keep the original URL in DB as fallback, but the API will prefer Telegram
      mimeType: file.type,
      telegramMessageId: tgSync?.messageId,
      telegramChatId: tgSync?.chatId,
      telegramFileId: tgSync?.fileId,
    },
  });

  return NextResponse.json(lectureFile, { status: 201 });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await Promise.resolve(ctx.params);
  if (!isSuperAdmin(scope.role)) {
    const lErr = await assertLecture(scope as any, id);
    if (lErr) return lErr;
  }
  const files = await prisma.lectureFile.findMany({ where: { lectureId: id } });
  
  // Use Telegram proxy URL if available to save bandwidth/storage
  const mappedFiles = files.map(f => ({
    ...f,
    url: f.telegramFileId ? `/api/v1/files/telegram/${f.id}` : f.url
  }));

  return NextResponse.json(mappedFiles);
}
