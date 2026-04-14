/**
 * lib/storage.ts — file storage: S3/R2, or local disk (USE_LOCAL_FILE_UPLOAD).
 *
 * Cloud (S3-compatible): S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY;
 * optional S3_ENDPOINT (R2), S3_PUBLIC_URL.
 *
 * Local (no card): USE_LOCAL_FILE_UPLOAD=true → writes under public/uploads/
 * (not for Vercel — use S3/R2/Uploadthing there).
 */

import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile, unlink } from "fs/promises";
import { UTApi } from "uploadthing/server";

/** Dev / self-hosted: save under public/uploads — no S3, no card. Not supported on Vercel (ephemeral disk). */
export function localDiskUploadEnabled(): boolean {
  return process.env.USE_LOCAL_FILE_UPLOAD === "true" && process.env.VERCEL !== "1";
}

function assertStorageConfigured(): void {
  if (!process.env.UPLOADTHING_TOKEN?.trim()) {
    throw new Error(
      "Object storage configured incorrectly: Set UPLOADTHING_TOKEN in .env. " +
        "For local development without cloud storage, set USE_LOCAL_FILE_UPLOAD=true"
    );
  }
}

// ─── Allowed MIME types ────────────────────────────────────────────────────────

export const ALLOWED_TYPES: Record<string, string[]> = {
  lecture: [
    "video/mp4", "video/webm", "video/ogg",
    "application/pdf",
    "image/jpeg", "image/png", "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  pastpaper: ["application/pdf"],
  avatar:    ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ad:        ["image/jpeg", "image/png", "image/webp"],
  forum:     ["image/jpeg", "image/png", "image/webp", "image/gif"],
  question:  ["image/jpeg", "image/png", "image/webp"],
  // Site logo (navbar / branding) — SUPER_ADMIN upload only
  site:      ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif", "image/bmp"],
  ai:        ["image/jpeg", "image/png", "image/webp", "image/gif"],
  template:  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"],
};

export const MAX_FILE_SIZE: Record<string, number> = {
  lecture:   100 * 1024 * 1024, // 100 MB
  pastpaper:  50 * 1024 * 1024, // 50 MB
  avatar:      5 * 1024 * 1024, // 5 MB
  ad:         10 * 1024 * 1024, // 10 MB
  forum:       8 * 1024 * 1024, // 8 MB
  question:   8 * 1024 * 1024, // 8 MB
  site:       10 * 1024 * 1024, // 10 MB
  ai:          4 * 1024 * 1024, // 4 MB — Dr. Q chat attachments
  template:   32 * 1024 * 1024, // 32 MB
};

// ─── Direct server-side upload (for small files / PDFs) ────────────────────────

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string
): Promise<{ url: string; key: string }> {
  const ext = path.extname(originalName).toLowerCase() || ".bin";
  const filename = `${randomUUID()}${ext}`;
  const segments = folder.split(/[/\\]+/).filter(Boolean);

  if (localDiskUploadEnabled()) {
    const dir = path.join(process.cwd(), "public", "uploads", ...segments);
    await mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, filename);
    await writeFile(fullPath, buffer);
    const key = [...segments, filename].join("/");
    return { url: `/uploads/${key}`, key };
  }

  assertStorageConfigured();
  const utapi = new UTApi();
  
  // Wrap buffer into a File object with custom name for UploadThing
  const f = new File([new Uint8Array(buffer)], filename, { type: mimeType });
  const response = await utapi.uploadFiles([f]);
  
  if (!response[0].data) throw new Error("UploadThing upload failed: " + response[0].error?.message);
  
  return { url: response[0].data.url, key: response[0].data.key };
}

export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  folder: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  throw new Error("Presigned uploads are deprecated. Use Client-Side UploadThing directly or Cloudinary signatures.");
}

// ─── Delete a file ─────────────────────────────────────────────────────────────

export async function deleteFile(key: string): Promise<void> {
  if (localDiskUploadEnabled()) {
    const full = path.join(process.cwd(), "public", "uploads", ...key.split("/").filter(Boolean));
    await unlink(full).catch(() => {});
    return;
  }
  assertStorageConfigured();
  const utapi = new UTApi();
  
  // Note: UploadThing uses the key for deletion
  if (key.startsWith("http")) { // If URL is passed instead of key by mistake
    const urlKey = key.split('/').pop();
    if (urlKey) await utapi.deleteFiles([urlKey]);
  } else {
    await utapi.deleteFiles([key]);
  }
}
