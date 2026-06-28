import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redisIncrWithExpire } from "@/lib/redis";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getFacultyPrefix, getUniqueUniAbbr } from "@/lib/telegram-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/captcha";

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
  captchaToken:     z.string().optional(),
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
      telegramPhone, verificationCode, captchaToken
    } = parsed.data;

    const cleanPhone = telegramPhone.replace(/[^0-9]/g, "");

    // Verify Turnstile CAPTCHA
    if (captchaToken) {
      const valid = await verifyTurnstileToken(captchaToken);
      if (!valid) {
        return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
      }
    }

    // Rate limit: 5 registrations per IP per hour
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const regCount = await redisIncrWithExpire(`register:${ip}`, 3600);
    if (regCount > 5) {
      return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
    }

    // 1. Verify Telegram Code (single query with botUser include)
    const botUser = await prisma.botUser.findFirst({
      where: { phoneNumber: cleanPhone }
    });

    if (!botUser) {
      return NextResponse.json({ error: "Telegram phone not found in bot database. Link it first." }, { status: 400 });
    }

    const authEntry = await prisma.botAuth.findUnique({
      where: { telegramId: botUser.telegramId }
    });

    if (!authEntry || authEntry.code !== verificationCode || authEntry.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired Telegram verification code" }, { status: 400 });
    }

    // 2. Check Uniqueness — single query with OR
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { nickname: { equals: nickname, mode: "insensitive" } },
          { telegramPhone: cleanPhone },
        ]
      },
      select: { email: true, nickname: true, telegramPhone: true }
    });

    if (existingUser) {
      if (existingUser.email === email) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      if (existingUser.nickname?.toLowerCase() === nickname.toLowerCase()) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      if (existingUser.telegramPhone === cleanPhone) return NextResponse.json({ error: "Telegram phone already linked to another account" }, { status: 409 });
    }

    // 3. Fetch university + faculty in parallel
    const [university, faculty] = await Promise.all([
      prisma.university.findUnique({ where: { id: universityId } }),
      prisma.faculty.findUnique({ where: { id: facultyId } }),
    ]);
    if (!university) return NextResponse.json({ error: "University not found" }, { status: 404 });
    if (!faculty) return NextResponse.json({ error: "Faculty not found" }, { status: 404 });

    // Get University Abbreviation
    let uniAbbr = university.abbr;
    if (!uniAbbr) {
      uniAbbr = await getUniqueUniAbbr(university.name);
      await prisma.university.update({ where: { id: universityId }, data: { abbr: uniAbbr } });
    }

    const facultyPrefix = getFacultyPrefix(faculty.category);
    const yearSuffix = new Date().getFullYear().toString().slice(-2);

    // Format: mnum26-24010511-201093510425
    const studentCode = `${uniAbbr}${facultyPrefix}${yearSuffix}-${studentId}-${cleanPhone}`;

    // 4. Create Supabase user + hash password in parallel
    const supabase = createAdminClient();

    const [sbResult, hashed] = await Promise.all([
      supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          universityId,
          facultyId,
          semesterId,
          onboarding_completed: true,
        },
      }),
      bcrypt.hash(password, 10),
    ]);

    if (sbResult.error) {
      console.error("[REGISTER] Supabase Error:", sbResult.error);
      return NextResponse.json({ error: sbResult.error.message }, { status: 400 });
    }

    const supabaseUserId = sbResult.data.user.id;

    // 5. Create User + cleanup verification code atomically
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: supabaseUserId,
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
      await tx.botAuth.delete({ where: { telegramId: botUser.telegramId } });
      return newUser;
    });

    // 6. Send confirmation email (fire-and-forget, after response)
    (async () => {
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: "signup",
          email,
          password: crypto.randomUUID(),
          options: { redirectTo: `${req.nextUrl.origin}/auth/callback?next=/dashboard-app` },
        });
        if (linkData?.properties?.action_link) {
          const { sendVerificationEmail } = await import("@/lib/email");
          await sendVerificationEmail(email, linkData.properties.action_link);
        }
      } catch (e) {
        console.warn("[REGISTER] Email send skipped:", e);
      }
    })();

    return NextResponse.json({
      id: user.id,
      name: user.name,
      studentCode,
      message: "Registration successful!"
    }, { status: 201, headers: { "Cache-Control": "no-store" } });

  } catch (error: any) {
    if (error?.code === "P2002" && error?.meta?.target?.includes?.("studentCode")) {
      return NextResponse.json({ error: "Student Registration Code already exists" }, { status: 409 });
    }
    console.error("[REGISTER] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
