import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GUEST_QUIZ_COOKIE } from "@/lib/guest-quiz";

function sanitize(s: unknown, max: number): string {
  return String(s ?? "")
    .trim()
    .slice(0, max);
}

/** Register or resume guest (name + external student ID). Sets httpOnly cookie. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const displayName = sanitize(body.displayName, 120);
  const externalStudentId = sanitize(body.externalStudentId, 64).replace(/\s+/g, "");

  if (displayName.length < 2) {
    return NextResponse.json({ error: "Enter your name (at least 2 characters)." }, { status: 400 });
  }
  if (externalStudentId.length < 1) {
    return NextResponse.json({ error: "Enter your student / national ID." }, { status: 400 });
  }

  const existing = await prisma.guestQuizUser.findUnique({
    where: { externalStudentId },
    select: { id: true },
  });

  const guest = existing
    ? await prisma.guestQuizUser.update({
        where: { id: existing.id },
        data: { displayName },
        select: { id: true, displayName: true, externalStudentId: true },
      })
    : await prisma.guestQuizUser.create({
        data: { displayName, externalStudentId },
        select: { id: true, displayName: true, externalStudentId: true },
      });

  const res = NextResponse.json({ ok: true, guest });
  res.cookies.set(GUEST_QUIZ_COOKIE, guest.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 120,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

/** Clear guest cookie (change identity). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GUEST_QUIZ_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
