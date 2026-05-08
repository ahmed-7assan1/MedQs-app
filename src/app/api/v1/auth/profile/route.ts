import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { syncFileToTelegram } from "@/lib/telegram-storage";

const optionalSocialUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return null;
    const t = String(v).trim();
    if (!t) return null;
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    return withProto;
  })
  .pipe(z.union([z.null(), z.string().url("Must be a valid URL")]));

const ProfileSchema = z.object({
  name: z.preprocess((v) => {
    if (v === undefined || v === null) return undefined;
    const t = String(v).trim();
    return t === "" ? undefined : t;
  }, z.string().min(2, "Name must be at least 2 characters").max(80).optional()),
  nickname:    z
    .string()
    .max(30)
    .trim()
    .regex(/^[a-zA-Z0-9._-]+$/, "Username may include letters, numbers, dot, underscore, dash")
    .nullable()
    .optional(),
  bio:         z.string().max(500).trim().nullable().optional(),
  phone:       z.string().max(20).trim().nullable().optional(),
  phoneVisible: z.boolean().optional(),
  isPrivate:   z.boolean().optional(),
  hideRank:    z.boolean().optional(),
  instagramUrl: optionalSocialUrl.optional(),
  facebookUrl: optionalSocialUrl.optional(),
  universityId: z.string().nullable().optional(),
  facultyId:   z.string().nullable().optional(),
  semesterId:  z.string().nullable().optional(),
  studentId: z.string().min(6).max(16).nullable().optional(),
  coverImage: z.string().nullable().optional(),
});

async function generateStudentId(): Promise<string> {
  const id = Math.floor(100000 + Math.random() * 900000).toString();
  const existing = await prisma.user.findFirst({ where: { studentId: id }, select: { id: true } });
  return existing ? generateStudentId() : id;
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

  if (parsed.data.nickname) {
    const existing = await prisma.user.findFirst({
      where: {
        id: { not: session.user.id },
        nickname: { equals: parsed.data.nickname, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { studentId: true },
  });
  const resolvedStudentId =
    parsed.data.studentId === "" || parsed.data.studentId === null
      ? current?.studentId ?? await generateStudentId()
      : parsed.data.studentId;

  if (parsed.data.coverImage && !parsed.data.coverImage.includes("/api/v1/files/telegram")) {
    const tgSync = await syncFileToTelegram(parsed.data.coverImage, "cover.jpg", "image/jpeg");
    if (tgSync?.fileId) {
      parsed.data.coverImage = `/api/v1/files/telegram/cover?fileId=${tgSync.fileId}`;
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...parsed.data,
      nickname: parsed.data.nickname === "" ? null : parsed.data.nickname,
      universityId: parsed.data.universityId === "" ? null : parsed.data.universityId,
      facultyId: parsed.data.facultyId === "" ? null : parsed.data.facultyId,
      semesterId: parsed.data.semesterId === "" ? null : parsed.data.semesterId,
      studentId: resolvedStudentId,
    },
    select: {
      id: true, name: true, nickname: true, bio: true, phone: true, phoneVisible: true,
      hideRank: true, isPrivate: true, instagramUrl: true, facebookUrl: true,
      semesterId: true, universityId: true, facultyId: true, studentId: true,
      coverImage: true,
    },
  });

  revalidatePath("/profile/me");
  revalidatePath(`/profile/u/${session.user.id}`);
  revalidatePath("/", "layout");

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
