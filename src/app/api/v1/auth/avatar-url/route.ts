/**
 * POST /api/v1/auth/avatar-url
 * Saves an already-uploaded avatar URL (from UploadThing client-side SDK) to the database.
 * The actual file upload happens directly browser → UploadThing, so no file data passes through here.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : null;
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: url },
  });

  revalidatePath("/profile/me");
  revalidatePath(`/profile/u/${session.user.id}`);
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, url });
}
