import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptKey } from "@/lib/encryption";

// GET: fetch whether a personal key exists (no plaintext leak)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { personalGeminiKey: true },
  });

  const hasKey = !!user?.personalGeminiKey;
  return NextResponse.json({ hasKey, maskedKey: hasKey ? "••••••••••" : null });
}

// POST: save (encrypted) or clear personal key
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await req.json();

  if (!key || !key.trim()) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { personalGeminiKey: null },
    });
    return NextResponse.json({ ok: true, cleared: true });
  }

  const trimmed = key.trim();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { personalGeminiKey: encryptKey(trimmed) },
  });

  return NextResponse.json({ ok: true });
}
