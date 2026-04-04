import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";

/**
 * Server-side upload to S3/R2 (avoids browser CORS issues with presigned PUT).
 * POST multipart: field "file", field "folder" = forum | question | ad | lecture | pastpaper
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read upload (try a smaller file or check server body limits)" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const folderRaw = form.get("folder");
  if (!(file instanceof File) || typeof folderRaw !== "string") {
    return NextResponse.json({ error: "Missing file or folder" }, { status: 400 });
  }

  const folder = folderRaw.trim();
  const allowed = ["forum", "question", "ad", "lecture", "pastpaper"] as const;
  if (!allowed.includes(folder as (typeof allowed)[number])) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  const role = (session.user as { role?: string }).role;
  if (folder !== "forum") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let mime = file.type || "application/octet-stream";
  if (!mime || mime === "application/octet-stream") {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mime = "image/jpeg";
    else if (lower.endsWith(".png")) mime = "image/png";
    else if (lower.endsWith(".webp")) mime = "image/webp";
    else if (lower.endsWith(".gif")) mime = "image/gif";
    else if (lower.endsWith(".pdf")) mime = "application/pdf";
  }

  const types = ALLOWED_TYPES[folder] ?? [];
  if (!types.includes(mime)) {
    return NextResponse.json(
      { error: `File type not allowed for ${folder}. Got: ${mime || "unknown"}` },
      { status: 400 }
    );
  }

  const maxSize = MAX_FILE_SIZE[folder] ?? 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Max ${Math.round(maxSize / (1024 * 1024))}MB` },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadFile(buffer, file.name, mime, folder);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[upload/direct]", e);
    const hint =
      e instanceof Error && e.message.includes("Object storage")
        ? e.message
        : "Storage upload failed. For free local dev (no card): set USE_LOCAL_FILE_UPLOAD=true in .env (not on Vercel). Or set S3_* / R2 keys for cloud storage.";
    return NextResponse.json({ error: hint }, { status: 500 });
  }
}

export const runtime = "nodejs";
