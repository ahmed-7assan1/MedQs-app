import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: fetch current personal key (masked)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { personalGeminiKey: true },
  });

  const key = user?.personalGeminiKey;
  // Mask everything except the last 6 chars for display
  const masked = key
    ? `${"•".repeat(Math.max(0, key.length - 6))}${key.slice(-6)}`
    : null;

  return NextResponse.json({ hasKey: !!key, maskedKey: masked });
}

// POST: save or clear personal key
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await req.json();

  // Validate key format (starts with AIza or empty string to clear)
  if (key && key.trim() && !key.trim().startsWith("AIza")) {
    return NextResponse.json(
      { error: "Invalid Gemini API key format. It should start with 'AIza'." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { personalGeminiKey: key?.trim() || null },
  });

  return NextResponse.json({ ok: true, cleared: !key?.trim() });
}
