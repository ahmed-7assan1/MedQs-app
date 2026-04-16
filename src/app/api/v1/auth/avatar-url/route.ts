/**
 * POST /api/v1/auth/avatar-url
 * Saves an already-uploaded avatar URL (from UploadThing client-side SDK) to the database.
 * Also deletes the previous avatar from Cloudinary automatically to avoid orphaned files.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Extract Cloudinary public_id from a Cloudinary delivery URL */
function extractCloudinaryPublicId(url: string): string | null {
  // https://res.cloudinary.com/{cloud}/image/upload/[v123/]<public_id>.<ext>
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z]+$/i);
  return match ? match[1] : null;
}

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : null;
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // ── Fetch current avatar URL before overwriting it ───────────────────────
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  // ── Delete old Cloudinary image (fire-and-forget, don't block response) ──
  if (user?.image && isCloudinaryUrl(user.image)) {
    const publicId = extractCloudinaryPublicId(user.image);
    if (publicId) {
      import("@/lib/cloudinary")
        .then(({ deleteFromCloudinary }) => deleteFromCloudinary(publicId))
        .catch((err) => console.warn("[avatar] Failed to delete old Cloudinary image:", err));
    }
  }

  // ── Save new URL to database ─────────────────────────────────────────────
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: url },
  });

  revalidatePath("/profile/me");
  revalidatePath(`/profile/u/${session.user.id}`);
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, url });
}
