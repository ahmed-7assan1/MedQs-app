import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";

/** Accepts http(s), local `/uploads/...` from USE_LOCAL_FILE_UPLOAD, and data URLs (fallback). */
function isValidQuestionImageUrl(s: string): boolean {
  if (s.startsWith("/uploads/")) return true;
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
    body: z.string().default(""),
    imageUrl: z
      .preprocess(
        (v) => (v === "" || v === undefined ? null : v),
        z.union([z.null(), z.string().refine(isValidQuestionImageUrl, { message: "Invalid image URL" })])
      )
      .optional(),
    stemLayout: z.enum(["STANDARD", "IMAGE_OVERLAY"]).optional(),
    choices: z.array(z.object({ key: z.string(), text: z.string() })).min(2),
    answer: z.string(),
    explanation: z.string().optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
    lectureId: z.string().uuid(),
  })
  .transform((d) => ({
    ...d,
    body: d.body.trim(),
    imageUrl: d.imageUrl === "" || d.imageUrl == null ? null : d.imageUrl,
    stemLayout: d.stemLayout ?? "STANDARD",
  }))
  .refine((d) => d.body.length >= 1 || Boolean(d.imageUrl), {
    message: "Add question text and/or an image",
    path: ["body"],
  })
  .refine((d) => d.stemLayout !== "IMAGE_OVERLAY" || Boolean(d.imageUrl), {
    message: "Overlay layout requires an image URL",
    path: ["stemLayout"],
  });

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lectureId = searchParams.get("lectureId");

  const questions = await prisma.question.findMany({
    where: lectureId ? { lectureId } : undefined,
    orderBy: { createdAt: "asc" },
    select: {
      id: true, body: true, imageUrl: true, stemLayout: true, choices: true, answer: true,
      explanation: true, difficulty: true, lectureId: true,
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
