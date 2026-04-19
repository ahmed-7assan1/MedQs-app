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
  const universityId = sanitize(body.universityId, 64);
  const facultyId = sanitize(body.facultyId, 64);
  const semesterId = sanitize(body.semesterId, 64);
  const displayName = sanitize(body.displayName, 100);
  const externalStudentId = sanitize(body.externalStudentId, 100);

  if (displayName.length < 2) {
    return NextResponse.json({ error: "Enter your name (at least 2 characters)." }, { status: 400 });
  }
  if (externalStudentId.length < 1) {
    return NextResponse.json({ error: "Enter your student / national ID." }, { status: 400 });
  }
  if (!universityId || !facultyId || !semesterId) {
    return NextResponse.json({ error: "Please select your University, Faculty, and Semester." }, { status: 400 });
  }

  const existing = await (prisma as any).guestQuizUser.findUnique({
    where: { externalStudentId },
    select: { id: true },
  });

  const data = {
    displayName,
    universityId,
    facultyId,
    semesterId,
  };

  const guest = existing
    ? await (prisma as any).guestQuizUser.update({
        where: { id: existing.id },
        data,
        select: { id: true, displayName: true, externalStudentId: true, semesterId: true },
      })
    : await (prisma as any).guestQuizUser.create({
        data: { ...data, externalStudentId },
        select: { id: true, displayName: true, externalStudentId: true, semesterId: true },
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
