import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name:        z.string().min(2).max(80).trim(),
  email:       z.string().email().toLowerCase(),
  password:    z.string().min(8, "Password must be at least 8 characters"),
  nickname:    z.string().min(3).max(24).regex(/^[a-zA-Z0-9._-]+$/, "Username may include letters, numbers, dot, underscore, dash"),
  studentId:   z.string().min(6).optional(),
  universityId: z.string().optional(),
  yearNumber:  z.number().optional(),
  semesterId:  z.string().optional(),
});

async function generateStudentId(): Promise<string> {
  const id = Math.floor(100000 + Math.random() * 900000).toString();
  const exists = await prisma.user.findFirst({ where: { studentId: id }, select: { id: true } });
  return exists ? generateStudentId() : id;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, nickname, studentId, universityId, yearNumber, semesterId } = parsed.data;

  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const existingNickname = await prisma.user.findFirst({ where: { nickname: { equals: nickname, mode: "insensitive" } } });
  if (existingNickname) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

  const resolvedStudentId = studentId ?? await generateStudentId();
  const existingId = await prisma.user.findFirst({ where: { studentId: resolvedStudentId } });
  if (existingId) return NextResponse.json({ error: "Student ID already in use" }, { status: 409 });

  // Validate student ID format against university/year config
  if (universityId && yearNumber) {
    const formatConfig = await prisma.universityYearIdFormat.findUnique({
      where: { universityId_yearNumber: { universityId, yearNumber } },
    });

    const university = await prisma.university.findUnique({
      where: { id: universityId },
      select: { idMinLength: true, idMaxLength: true },
    });

    const minLen = formatConfig?.minLength ?? university?.idMinLength ?? 6;
    const maxLen = formatConfig?.maxLength ?? university?.idMaxLength ?? 10;
    const prefix = formatConfig?.prefix;

    // Length check
    if (resolvedStudentId.length < minLen || resolvedStudentId.length > maxLen) {
      return NextResponse.json(
        { error: `Student ID must be ${minLen}–${maxLen} characters for your university/year` },
        { status: 400 }
      );
    }

    // Prefix check
    if (prefix && !resolvedStudentId.startsWith(prefix)) {
      return NextResponse.json(
        { error: `Student ID must start with "${prefix}" for your year` },
        { status: 400 }
      );
    }

    // Prevent all-same-digit IDs like 111111, 000000
    if (/^(.)\1+$/.test(resolvedStudentId)) {
      return NextResponse.json(
        { error: "Student ID cannot be all the same digit (e.g. 111111)" },
        { status: 400 }
      );
    }

    // Prevent all-zero IDs
    if (/^0+$/.test(resolvedStudentId)) {
      return NextResponse.json(
        { error: "Student ID cannot be all zeros" },
        { status: 400 }
      );
    }
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      nickname,
      email,
      password: hashed,
      studentId: resolvedStudentId,
      semesterId: semesterId || null,
      universityId: universityId || null,
      rankId: "newbie",
    },
  });

  return NextResponse.json({ id: user.id, name: user.name }, { status: 201 });
}
