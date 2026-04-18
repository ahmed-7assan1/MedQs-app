import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  try {
    await prisma.lecture.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE lecture]", e);
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await Promise.resolve(ctx.params);
  const lecture = await prisma.lecture.findUnique({
    where: { id },
    include: {
      flashcards: true,
      questions: { select: { id: true, body: true, difficulty: true, answer: true, choices: true } },
      files: true,
      videos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!lecture) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin(scope.role)) {
    const inScope = await prisma.lecture.findFirst({
      where: {
        id,
        subject: { module: { semester: { academicYear: { universityId: scope.universityId! } } } },
      },
      select: { id: true },
    });
    if (!inScope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await prisma
    .$queryRaw<Array<{ uiConfig: any; extras: any }>>(
      Prisma.sql`SELECT "uiConfig","extras" FROM "Lecture" WHERE "id" = ${id} LIMIT 1`
    )
    .catch(() => []);
  return NextResponse.json({ ...(lecture as any), uiConfig: rows?.[0]?.uiConfig ?? null, extras: rows?.[0]?.extras ?? null });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  const body = await req.json().catch(() => ({}));
  const data: { title?: string; videoUrl?: string | null; notesMarkdown?: string | null } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.videoUrl === null || typeof body.videoUrl === "string") data.videoUrl = body.videoUrl?.trim() || null;
  if (typeof body.notesMarkdown === "string") data.notesMarkdown = body.notesMarkdown;

  // uiConfig / extras are stored as JSON and updated via raw SQL so this works even if Prisma Client wasn't regenerated.
  const uiConfig = body && typeof body.uiConfig === "object" && body.uiConfig !== null ? body.uiConfig : null;
  const extrasDeleteKeys = Array.isArray(body.extrasDeleteKeys) ? body.extrasDeleteKeys : null;

  if (Object.keys(data).length === 0 && !uiConfig && !extrasDeleteKeys)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  if (uiConfig || extrasDeleteKeys) {
    // Load current JSON blobs
    const rows = await prisma.$queryRaw<Array<{ uiConfig: any; extras: any }>>(
      Prisma.sql`SELECT "uiConfig","extras" FROM "Lecture" WHERE "id" = ${id} LIMIT 1`
    );
    const prevUi = (rows?.[0]?.uiConfig ?? {}) as any;
    const prevExtras = (rows?.[0]?.extras ?? {}) as any;
    const nextUi = uiConfig ? { ...prevUi, ...(uiConfig as any) } : prevUi;
    let nextExtras = prevExtras;
    if (extrasDeleteKeys) {
      nextExtras = { ...(prevExtras as any) };
      for (const k of extrasDeleteKeys) {
        if (typeof k === "string" && k.trim()) delete (nextExtras as any)[k.trim()];
      }
    }
    const uiJson = JSON.stringify(nextUi);
    const extrasJson = JSON.stringify(nextExtras);
    await prisma.$executeRaw(
      Prisma.sql`UPDATE "Lecture" SET "uiConfig" = ${uiJson}::jsonb, "extras" = ${extrasJson}::jsonb WHERE "id" = ${id}`
    );
  }

  if (Object.keys(data).length > 0) {
    const lecture = await prisma.lecture.update({
      where: { id },
      data,
    });
    return NextResponse.json(lecture);
  }
  return NextResponse.json({ ok: true });
}
