import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";

/** Accepts http(s), local `/uploads/...` from USE_LOCAL_FILE_UPLOAD, and data URLs (fallback). */
function isValidQuestionImageUrl(s: string): boolean {
  if (s.startsWith("/")) return true;
  if (s.startsWith("data:image/")) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const CreateSchema = z
  .object({
    questionType: z.enum(["MCQ", "ESSAY"]).optional(),
    body: z.string().default(""),
    imageUrl: z
      .preprocess(
        (v) => (v === "" || v === undefined ? null : v),
        z.union([z.null(), z.string().refine(isValidQuestionImageUrl, { message: "Invalid image URL" })])
      )
      .optional(),
    stemLayout: z.enum(["STANDARD", "IMAGE_OVERLAY"]).optional(),
    choices: z.array(z.object({ key: z.string(), text: z.string() })).optional(),
    answer: z.string().default(""),
    essayReference: z.string().optional(),
    explanation: z.string().optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
    lectureId: z.string().uuid(),
  })
  .transform((d) => ({
    ...d,
    questionType: d.questionType ?? "MCQ",
    choices: d.questionType === "ESSAY" ? [] : d.choices ?? [],
    body: d.body.trim(),
    imageUrl: d.imageUrl === "" || d.imageUrl == null ? null : d.imageUrl,
    stemLayout: d.stemLayout ?? "STANDARD",
    essayReference: d.essayReference?.trim() || null,
  }))
  .refine((d) => d.body.length >= 1 || Boolean(d.imageUrl), {
    message: "Add question text and/or an image",
    path: ["body"],
  })
  .refine((d) => d.stemLayout !== "IMAGE_OVERLAY" || Boolean(d.imageUrl), {
    message: "Overlay layout requires an image URL",
    path: ["stemLayout"],
  })
  .refine((d) => (d.questionType === "ESSAY" ? true : (d.choices?.length ?? 0) >= 2), {
    message: "MCQ must include at least 2 choices",
    path: ["choices"],
  })
  .refine((d) => (d.questionType === "ESSAY" ? true : Boolean(d.answer)), {
    message: "MCQ must include a correct answer key",
    path: ["answer"],
  });

export async function GET(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lectureId = searchParams.get("lectureId");
  if (!lectureId) {
    // Prevent global question enumeration.
    if (!isSuperAdmin(scope.role)) return NextResponse.json({ error: "lectureId required" }, { status: 400 });
  } else if (!isSuperAdmin(scope.role)) {
    const boundary = await assertLecture(scope as any, lectureId);
    if (boundary) return boundary;
  }

  const questions = await prisma.question.findMany({
    where: lectureId ? { lectureId } : undefined,
    orderBy: { createdAt: "asc" },
    select: {
      id: true, questionType: true, body: true, imageUrl: true, stemLayout: true, choices: true, answer: true,
      essayReference: true, explanation: true, difficulty: true, lectureId: true,
      lecture: { select: { title: true } },
    },
  });

  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const boundary = await assertLecture(w.scope, parsed.data.lectureId);
  if (boundary) return boundary;

  const question = await prisma.question.create({ data: parsed.data });
  return NextResponse.json(question, { status: 201 });
}
