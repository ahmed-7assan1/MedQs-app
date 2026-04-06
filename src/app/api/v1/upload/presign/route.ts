import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";
import { requireAdminWriter } from "@/lib/admin-scope";

/**
 * POST /api/v1/upload/presign
 * Body: { fileName, mimeType, folder }
 * Returns: { uploadUrl, publicUrl, key }
 *
 * Client uploads directly to S3 using uploadUrl (PUT request),
 * then calls the appropriate resource API with publicUrl to save it.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileName, mimeType, folder, fileSize } = await req.json();

  // Validate folder
  const validFolders = ["lecture", "pastpaper", "avatar", "ad", "forum", "question"];
  if (!validFolders.includes(folder))
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });

  // Admins only for non-avatar uploads
  if (folder !== "avatar" && folder !== "forum") {
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;
  }

  // Validate MIME type
  const allowed = ALLOWED_TYPES[folder] ?? [];
  if (!allowed.includes(mimeType))
    return NextResponse.json({ error: `File type not allowed. Allowed: ${allowed.join(", ")}` }, { status: 400 });

  // Validate size
  const maxSize = MAX_FILE_SIZE[folder] ?? 10 * 1024 * 1024;
  if (fileSize && fileSize > maxSize)
    return NextResponse.json({ error: `File too large. Max: ${Math.round(maxSize / 1024 / 1024)}MB` }, { status: 400 });

  const result = await getPresignedUploadUrl(fileName, mimeType, folder);
  return NextResponse.json(result);
}
