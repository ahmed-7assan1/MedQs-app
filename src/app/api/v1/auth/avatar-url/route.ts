/**
 * POST /api/v1/auth/avatar-url
 * Saves an already-uploaded avatar URL (from UploadThing client-side SDK) to the database.
 * Priority: Cloudinary → Telegram CDN (fallback).
 * Also deletes the previous avatar from Cloudinary automatically to avoid orphaned files.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { syncFileToTelegram } from "@/lib/telegram-storage";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : null;
  if (url && (!url.startsWith("http") || url.length < 10)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch current avatar URL before overwriting it
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  // Delete old Cloudinary image (fire-and-forget)
  if (user?.image?.includes("res.cloudinary.com")) {
    const publicId = extractCloudinaryPublicId(user.image);
    if (publicId) {
      cloudinary.uploader
        .destroy(publicId, { resource_type: "image" })
        .catch(() => {});
    }
  }

  let finalUrl: string | null = null;

  if (url) {
    // ── 1. Try Cloudinary (primary) ────────────────────────────────────────
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: "medqs/avatars",
        resource_type: "image",
        fetch_format: "auto",
        quality: "auto",
      });
      finalUrl = result.secure_url;
    } catch (cloudErr) {
      console.warn("[avatar] Cloudinary upload failed, falling back to Telegram:", cloudErr);
    }

    // ── 2. Fallback: Telegram CDN ──────────────────────────────────────────
    if (!finalUrl) {
      const tgSync = await syncFileToTelegram(url, "avatar.jpg", "image/jpeg");
      if (tgSync?.fileId) {
        finalUrl = `/api/v1/files/telegram/avatar?fileId=${tgSync.fileId}`;
      }
    }

    // ── 3. Ultimate fallback: original UploadThing URL ─────────────────────
    if (!finalUrl) {
      finalUrl = url;
    }
  }

  // Save to database (null if url was empty — user removed avatar)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: finalUrl },
  });

  revalidatePath("/profile/me");
  revalidatePath(`/profile/u/${session.user.id}`);
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, url: finalUrl });
}

function extractCloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z]+$/i);
  return match ? match[1] : null;
}
