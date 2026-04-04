/**
 * lib/storage.ts — S3-compatible file storage (AWS S3 or Cloudflare R2)
 * Uses the AWS SDK v3 with S3Client directly — no heavy framework needed.
 *
 * Required env vars:
 *   S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY
 *   S3_ENDPOINT  (for R2: https://<account-id>.r2.cloudflarestorage.com)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import path from "path";

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
};

export const MAX_FILE_SIZE: Record<string, number> = {
  lecture:   100 * 1024 * 1024, // 100 MB
  pastpaper:  50 * 1024 * 1024, // 50 MB
  avatar:      5 * 1024 * 1024, // 5 MB
  ad:         10 * 1024 * 1024, // 10 MB
  forum:       8 * 1024 * 1024, // 8 MB
  question:   8 * 1024 * 1024, // 8 MB
};

// ─── Direct server-side upload (for small files / PDFs) ────────────────────────

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string
): Promise<{ url: string; key: string }> {
  const ext = path.extname(originalName).toLowerCase();
  const key = `${folder}/${randomUUID()}${ext}`;

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
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
