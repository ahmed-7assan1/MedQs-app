import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";
import { requireAdminWriter } from "@/lib/admin-scope";

/**
 * Server-side upload to S3/R2 (avoids browser CORS issues with presigned PUT).
 * POST multipart: field "file", field "folder" = forum | question | ad | lecture | pastpaper
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: any;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read upload (try a smaller file or check server body limits)" },
      { status: 400 }
    );
  }

  const rawFile = form.get("file");
  const folderRaw = form.get("folder");
  /** `FormData` typing is File | string; runtime may still be a Blob-like body. */
  const file: Blob | null =
    rawFile != null && typeof rawFile !== "string" && typeof (rawFile as Blob).size === "number"
      ? (rawFile as Blob).size > 0
        ? (rawFile as Blob)
        : null
      : null;
  if (!file || typeof folderRaw !== "string") {
    return NextResponse.json({ error: "Missing file or folder" }, { status: 400 });
  }

  const folder = folderRaw.trim();
  const allowed = ["forum", "question", "ad", "lecture", "pastpaper", "site", "ai", "template"] as const;
  if (!allowed.includes(folder as (typeof allowed)[number])) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  if (folder === "site") {
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;
  } else if (folder === "ai") {
    // Any signed-in student — images for Dr. Q (URL can be sent to model or used elsewhere)
  } else if (folder !== "forum") {
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;
  }

  const origName =
    typeof File !== "undefined" && file instanceof File && file.name ? file.name : "upload.bin";

  let mime = file.type || "application/octet-stream";
  if (!mime || mime === "application/octet-stream") {
    const lower = origName.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mime = "image/jpeg";
    else if (lower.endsWith(".png")) mime = "image/png";
    else if (lower.endsWith(".webp")) mime = "image/webp";
    else if (lower.endsWith(".gif")) mime = "image/gif";
    else if (lower.endsWith(".svg")) mime = "image/svg+xml";
    else if (lower.endsWith(".avif")) mime = "image/avif";
    else if (lower.endsWith(".bmp")) mime = "image/bmp";
    else if (lower.endsWith(".pdf")) mime = "application/pdf";
    else if (lower.endsWith(".docx")) mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (lower.endsWith(".doc")) mime = "application/msword";
  }
  // Some browsers send "image/jpg" instead of "image/jpeg"
  if (mime === "image/jpg") mime = "image/jpeg";

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
    const { url } = await uploadFile(buffer, origName, mime, folder);
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
