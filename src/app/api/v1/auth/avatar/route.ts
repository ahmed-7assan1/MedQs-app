import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.avatar.includes(file.type))
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF allowed" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE.avatar)
    return NextResponse.json({ error: "Max 5MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadFile(buffer, file.name, file.type, `avatars/${session.user.id}`);

  await prisma.user.update({ where: { id: session.user.id }, data: { image: url } });

  revalidatePath("/profile/me");
  revalidatePath(`/profile/u/${session.user.id}`);
  revalidatePath("/", "layout");

  return NextResponse.json({ url });
}
