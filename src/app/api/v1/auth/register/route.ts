import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getFacultyPrefix, getUniqueUniAbbr } from "@/lib/telegram-auth";

const RegisterSchema = z.object({
  name:             z.string().min(2).max(80).trim(),
  email:            z.string().email().toLowerCase(),
  password:         z.string().min(8, "Password must be at least 8 characters"),
  nickname:         z.string().min(3).max(24).regex(/^[a-zA-Z0-9._-]+$/, "Username may include letters, numbers, dot, underscore, dash"),
  studentId:        z.string().min(4, "Registration ID is required").trim(),
  universityId:     z.string().min(1, "University is required"),
  facultyId:        z.string().min(1, "Faculty is required"),
  semesterId:       z.string().optional(),
  telegramPhone:    z.string().min(10, "Telegram phone is required"),
  verificationCode: z.string().length(6, "6-digit code required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { 
      name, email, password, nickname, studentId, 
      universityId, facultyId, semesterId, 
      telegramPhone, verificationCode 
    } = parsed.data;

    const cleanPhone = telegramPhone.replace(/[^0-9]/g, "");

    // 1. Verify Telegram Code
    const botUser = await (prisma as any).botUser.findFirst({
      where: { phoneNumber: cleanPhone }
    });

    if (!botUser) {
      return NextResponse.json({ error: "Telegram phone not found in bot database. Link it first." }, { status: 400 });
    }

    const authEntry = await (prisma as any).botAuth.findUnique({
      where: { telegramId: botUser.telegramId }
    });

    if (!authEntry || authEntry.code !== verificationCode || authEntry.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired Telegram verification code" }, { status: 400 });
    }

    // 2. Check Uniqueness
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const existingNickname = await prisma.user.findFirst({ where: { nickname: { equals: nickname, mode: "insensitive" } } });
    if (existingNickname) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

    const existingPhone = await (prisma.user as any).findFirst({ where: { telegramPhone: cleanPhone } });
    if (existingPhone) return NextResponse.json({ error: "Telegram phone already linked to another account" }, { status: 409 });

    // 3. Generate Custom studentCode (Database ID)
    const university = await prisma.university.findUnique({ where: { id: universityId } });
    if (!university) return NextResponse.json({ error: "University not found" }, { status: 404 });

    const faculty = await (prisma.faculty as any).findUnique({ where: { id: facultyId } });
    if (!faculty) return NextResponse.json({ error: "Faculty not found" }, { status: 404 });

    // Get University Abbreviation (Update if not set)
    let uniAbbr = (university as any).abbr;
    if (!uniAbbr) {
      uniAbbr = await getUniqueUniAbbr(university.name);
      await (prisma.university as any).update({ where: { id: universityId }, data: { abbr: uniAbbr } });
    }

    const facultyPrefix = getFacultyPrefix(faculty.category);
    const yearSuffix = new Date().getFullYear().toString().slice(-2); // e.g., 26
    
    // Format: mnum26-24010511-201093510425
    const studentCode = `${uniAbbr}${facultyPrefix}${yearSuffix}-${studentId}-${cleanPhone}`;

    const existingCode = await (prisma.user as any).findUnique({ where: { studentCode } });
    if (existingCode) return NextResponse.json({ error: "Student Registration Code already exists" }, { status: 409 });

    // 4. Create User in Supabase Auth first
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data: sbData, error: sbError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name,
        universityId,
        facultyId,
        semesterId,
        onboarding_completed: true
      }
    });

    if (sbError) {
      console.error("[REGISTER] Supabase Error:", sbError);
      return NextResponse.json({ error: sbError.message }, { status: 400 });
    }

    const supabaseUserId = sbData.user.id;

    // 5. Create User in Prisma (use same ID as Supabase)
    const hashed = await bcrypt.hash(password, 12);

    const user = await (prisma.user as any).create({
      data: {
        id: supabaseUserId, // Sync IDs
        name,
        nickname,
        email,
        password: hashed,
        studentId, 
        studentCode, 
        telegramPhone: cleanPhone,
        telegramId: botUser.telegramId,
        telegramVerified: true,
        universityId,
        facultyId,
        semesterId: semesterId || null,
        rankId: "newbie",
      },
    });

    // 6. Generate Link and Send Custom Email
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        options: { redirectTo: `${req.nextUrl.origin}/auth/callback?next=/dashboard-app` }
      });

      if (!linkError && linkData.properties?.action_link) {
        const { sendVerificationEmail } = await import("@/lib/email");
        await sendVerificationEmail(email, linkData.properties.action_link);
      }
    } catch (emailErr) {
      console.error("[REGISTER] Email Send Error (Non-blocking):", emailErr);
    }

    // Clean up verification code
    await (prisma as any).botAuth.delete({ where: { telegramId: botUser.telegramId } }).catch(() => {});

    return NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      studentCode,
      message: "Registration successful. Please verify your email."
    }, { status: 201 });

  } catch (error: any) {
    console.error("[REGISTER] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
