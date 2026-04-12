/**
 * lib/storage.ts — file storage: S3/R2, or local disk (USE_LOCAL_FILE_UPLOAD).
 *
 * Cloud (S3-compatible): S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY;
 * optional S3_ENDPOINT (R2), S3_PUBLIC_URL.
 *
 * Local (no card): USE_LOCAL_FILE_UPLOAD=true → writes under public/uploads/
 * (not for Vercel — use S3/R2/Uploadthing there).
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile, unlink } from "fs/promises";

/** Dev / self-hosted: save under public/uploads — no S3, no card. Not supported on Vercel (ephemeral disk). */
export function localDiskUploadEnabled(): boolean {
  return process.env.USE_LOCAL_FILE_UPLOAD === "true" && process.env.VERCEL !== "1";
}

function getClient(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
    // Force path-style for R2 and local MinIO
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
}

const BUCKET = process.env.S3_BUCKET ?? "medqs";

function assertStorageConfigured(): void {
  if (!process.env.S3_ACCESS_KEY?.trim() || !process.env.S3_SECRET_KEY?.trim()) {
    throw new Error(
      "Object storage is not configured: set S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, and S3_PUBLIC_URL (or S3_ENDPOINT for R2). " +
        "For local development without S3, set USE_LOCAL_FILE_UPLOAD=true in .env (files go to public/uploads/) and restart the dev server."
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
  const key = `${folder}/${filename}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000",
    })
  );

  const url = process.env.S3_PUBLIC_URL
    ? `${process.env.S3_PUBLIC_URL}/${key}`
    : `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

  return { url, key };
}

// ─── Presigned PUT URL (for large files — browser uploads directly) ────────────

export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  folder: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  if (localDiskUploadEnabled()) {
    throw new Error(
      "Presigned S3 upload is disabled when USE_LOCAL_FILE_UPLOAD=true. Use POST /api/v1/upload/direct instead."
    );
  }
  assertStorageConfigured();
  const ext = path.extname(fileName).toLowerCase();
  const key = `${folder}/${randomUUID()}${ext}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000",
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 }); // 5 min

  const publicUrl = process.env.S3_PUBLIC_URL
    ? `${process.env.S3_PUBLIC_URL}/${key}`
    : `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key };
}

// ─── Delete a file ─────────────────────────────────────────────────────────────

export async function deleteFile(key: string): Promise<void> {
  if (localDiskUploadEnabled()) {
    const full = path.join(process.cwd(), "public", "uploads", ...key.split("/").filter(Boolean));
    await unlink(full).catch(() => {});
    return;
  }
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
