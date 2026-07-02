import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getFacultyPrefix, getUniqueUniAbbr } from "@/lib/telegram-auth";
import { encryptKey } from "@/lib/encryption";

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
  nickname:    z.preprocess((v) => (v === "" || v === null ? undefined : v), 
    z.string().max(30).trim().regex(/^[a-zA-Z0-9._-]+$/, "Username may include letters, numbers, dot, underscore, dash").optional()
  ),
  handle:      z.preprocess((v) => (v === "" || v === null ? undefined : v),
    z.string().max(30).trim().regex(/^[a-zA-Z0-9._-]+$/, "Handle may include letters, numbers, dot, underscore, dash").optional()
  ),
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
  studentId: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().min(4).max(24).optional()),
  coverImage: z.string().nullable().optional(),
  telegramPhone: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().min(10).optional()),
  verificationCode: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().length(6).optional()),
  useCustomKey: z.boolean().optional(),
  personalGeminiKey: z.string().nullable().optional(),
  personalOpenAIKey: z.string().nullable().optional(),
  personalGroqKey: z.string().nullable().optional(),
  personalOpenRouterKey: z.string().nullable().optional(),
  personalXAIKey: z.string().nullable().optional(),
  personalAnthropicKey: z.string().nullable().optional(),
  personalSiliconFlowKey: z.string().nullable().optional(),
  personalSiliconFlowModel: z.string().nullable().optional(),
  personalSiliconFlowUrl: z.string().nullable().optional(),
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

  const { telegramPhone, verificationCode, universityId, facultyId, studentId, nickname, handle } = parsed.data;

  // ── Telegram Verification Check ──
  let telegramData: any = {};
  if (telegramPhone && verificationCode) {
    const cleanPhone = telegramPhone.replace(/[^0-9]/g, "");
    const botUser = await (prisma as any).botUser.findFirst({ where: { phoneNumber: cleanPhone } });
    if (!botUser) return NextResponse.json({ error: "Telegram phone not found in bot database. Please link it first." }, { status: 400 });

    const authEntry = await (prisma as any).botAuth.findUnique({ where: { telegramId: botUser.telegramId } });
    if (!authEntry || authEntry.code !== verificationCode || authEntry.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired Telegram code" }, { status: 400 });
    }
    
    telegramData = {
      telegramPhone: cleanPhone,
      telegramId: botUser.telegramId,
      telegramVerified: true,
    };
  }

  if (nickname) {
    const existing = await prisma.user.findFirst({
      where: {
        id: { not: session.user.id },
        nickname: { equals: nickname, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const current: any = await prisma.user.findUnique({
    where: session.user.email ? { email: session.user.email } : { id: session.user.id },
    select: { 
      studentId: true, 
      universityId: true, 
      facultyId: true, 
      telegramPhone: true, 
      telegramVerified: true, 
      studentCode: true,
      personalGeminiKey: true,
      personalOpenAIKey: true,
      personalGroqKey: true,
      personalOpenRouterKey: true,
      personalXAIKey: true,
      personalAnthropicKey: true,
      personalSiliconFlowKey: true,
    } as any,
  });

  const resolvedStudentId =
    studentId === "" || studentId === null
      ? current?.studentId ?? await generateStudentId()
      : studentId;

  // ── Custom studentCode Generation (Only if verified and has institutional info) ──
  let studentCode = current?.studentCode;
  const finalUniId = universityId || current?.universityId;
  const finalFacId = facultyId || current?.facultyId;
  const finalPhone = telegramData.telegramPhone || current?.telegramPhone;
  const isVerified = telegramData.telegramVerified || current?.telegramVerified;

  if (isVerified && finalUniId && finalFacId && finalPhone && (!studentCode || universityId || facultyId)) {
    const university: any = await prisma.university.findUnique({ where: { id: finalUniId } });
    const faculty = await (prisma.faculty as any).findUnique({ where: { id: finalFacId } });
    
    if (university && faculty) {
      let uniAbbr = university.abbr;
      if (!uniAbbr) {
        uniAbbr = await getUniqueUniAbbr(university.name);
        await (prisma.university as any).update({ where: { id: finalUniId }, data: { abbr: uniAbbr } });
      }
      const facultyPrefix = getFacultyPrefix(faculty.category);
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      studentCode = `${uniAbbr}${facultyPrefix}${yearSuffix}-${resolvedStudentId}-${finalPhone}`;
    }
  }

  // Handle key overrides for masked keys (ignore overwrite if client sent '••••••••')
  // Encrypt new keys at rest — existing encrypted keys are preserved when masked
  const maybeEncrypt = (raw: string | null | undefined, existing: string | null | undefined): string | null | undefined => {
    if (raw === "••••••••" || raw === undefined) return existing;
    if (!raw || !raw.trim()) return null;
    return encryptKey(raw.trim());
  };
  const geminiKey = maybeEncrypt(parsed.data.personalGeminiKey, current?.personalGeminiKey);
  const openaiKey = maybeEncrypt(parsed.data.personalOpenAIKey, current?.personalOpenAIKey);
  const groqKey = maybeEncrypt(parsed.data.personalGroqKey, current?.personalGroqKey);
  const openrouterKey = maybeEncrypt(parsed.data.personalOpenRouterKey, current?.personalOpenRouterKey);
  const xaiKey = maybeEncrypt(parsed.data.personalXAIKey, current?.personalXAIKey);
  const anthropicKey = maybeEncrypt(parsed.data.personalAnthropicKey, current?.personalAnthropicKey);
  const siliconflowKey = maybeEncrypt(parsed.data.personalSiliconFlowKey, current?.personalSiliconFlowKey);

  // Remove verificationCode from data before passing to update
  const { verificationCode: _, ...updateData } = parsed.data;

  // Overwrite sensitive key fields resolved from masked states
  const resolvedUpdate = {
    ...updateData,
    personalGeminiKey: geminiKey,
    personalOpenAIKey: openaiKey,
    personalGroqKey: groqKey,
    personalOpenRouterKey: openrouterKey,
    personalXAIKey: xaiKey,
    personalAnthropicKey: anthropicKey,
    personalSiliconFlowKey: siliconflowKey,
  };

  const user = await prisma.user.upsert({
    where: session.user.email ? { email: session.user.email } : { id: session.user.id },
    create: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name || "Student",
      ...resolvedUpdate,
      ...telegramData,
      studentCode,
      nickname: nickname === "" ? null : nickname,
      handle: handle === "" ? null : handle,
      universityId: universityId === "" ? null : universityId,
      facultyId: facultyId === "" ? null : facultyId,
      semesterId: parsed.data.semesterId === "" ? null : parsed.data.semesterId,
      studentId: resolvedStudentId,
    },
    update: {
      ...resolvedUpdate,
      ...telegramData,
      studentCode,
      nickname: nickname === "" ? null : nickname,
      handle: handle === "" ? null : handle,
      universityId: universityId === "" ? null : universityId,
      facultyId: facultyId === "" ? null : facultyId,
      semesterId: parsed.data.semesterId === "" ? null : parsed.data.semesterId,
      studentId: resolvedStudentId,
    },
    select: {
      id: true, name: true, nickname: true, bio: true, phone: true, phoneVisible: true,
      hideRank: true, isPrivate: true, instagramUrl: true, facebookUrl: true,
      semesterId: true, universityId: true, facultyId: true, studentId: true,
      coverImage: true, telegramVerified: true, studentCode: true, handle: true, telegramPhone: true, image: true,
      useCustomKey: true,
    } as any,
  });

  // ── Sync with Supabase Auth Metadata ──
  try {
    const { createClient: createAdminClient } = await import("@/lib/supabase/server");
    const adminSupabase = createAdminClient(); 
    // Note: createClient usually uses the service role if configured or just updates current user
    await adminSupabase.auth.updateUser({
      data: {
        name: user.name,
        nickname: user.nickname,
        image: user.image,
        avatar_url: user.image,
        universityId: user.universityId,
        facultyId: user.facultyId,
        semesterId: user.semesterId,
      }
    });
  } catch (syncErr) {
    console.warn("[profile-sync] Failed to sync to Supabase metadata:", syncErr);
  }

  revalidatePath("/profile/me");
  revalidatePath(`/profile/u/${session.user.id}`);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard-app");

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { deleteUserAccount } = await import("@/lib/account-deletion");
    await deleteUserAccount(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
