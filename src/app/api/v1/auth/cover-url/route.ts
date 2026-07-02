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

  // Fetch current cover URL before overwriting it
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coverImage: true },
  });

  // Delete old Cloudinary cover image (fire-and-forget)
  if (user?.coverImage?.includes("res.cloudinary.com")) {
    const publicId = extractCloudinaryPublicId(user.coverImage);
    if (publicId) {
      cloudinary.uploader
        .destroy(publicId, { resource_type: "image" })
        .catch(() => {});
    }
  }

  let finalUrl: string | null = null;

  if (url) {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: "medqs/covers",
        resource_type: "image",
        fetch_format: "auto",
        quality: "auto",
      });
      finalUrl = result.secure_url;
    } catch (cloudErr) {
      console.warn("[cover] Cloudinary upload failed, falling back to Telegram:", cloudErr);
    }

    if (!finalUrl) {
      const tgSync = await syncFileToTelegram(url, "cover.jpg", "image/jpeg");
      if (tgSync?.fileId) {
        finalUrl = `/api/v1/files/telegram/cover?fileId=${tgSync.fileId}`;
      }
    }

    if (!finalUrl) {
      finalUrl = url;
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { coverImage: finalUrl },
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
