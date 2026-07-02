import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { generateLectureExtrasWithMeta } from "@/lib/gemini";
import { resolveBestKey } from "@/lib/byok-resolver";

function normalizePreferredProvider(raw: unknown): "gemini" | "openai" | "anthropic" | "deepseek" | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (s === "gemini" || s === "openai" || s === "anthropic" || s === "deepseek") return s;
  return undefined;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const body = await req.json().catch(() => ({}));
  const lectureId = typeof body.lectureId === "string" ? body.lectureId.trim() : "";
  const preferredProvider = typeof body.preferredProvider === "string" ? body.preferredProvider.trim() : "";
  const customApiKey = typeof body.customApiKey === "string" ? body.customApiKey.trim() : "";
  const wantOverviewCards = Boolean(body.overviewCards);
  const wantMnemonics = Boolean(body.mnemonics);
  const wantCases = Boolean(body.cases);
  const wantMindMaps = Boolean(body.mindMaps);
  const sourceText = typeof body.sourceText === "string" ? body.sourceText : "";
  const dryRun = Boolean(body.dryRun);

  if (!lectureId) return NextResponse.json({ error: "lectureId required" }, { status: 400 });
  if (!wantOverviewCards && !wantMnemonics && !wantCases && !wantMindMaps) {
    return NextResponse.json({ error: "Select at least one output" }, { status: 400 });
  }

  const boundary = await assertLecture(w.scope, lectureId);
  if (boundary) return boundary;

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { subject: { select: { name: true, module: { select: { name: true } } } } },
  });
  if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  const { getSiteConfig: getCfg } = await import("@/lib/get-site-config");
  const site = await getCfg().catch(() => null);
  const effectiveProvider =
    normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);

  let effectiveKey = customApiKey;
  if (!effectiveKey && effectiveProvider) {
    const userWithKeys = await prisma.user.findUnique({
      where: { id: session!.user!.id },
      include: { adminAiKeys: true },
    });
    const resolved = resolveBestKey(userWithKeys, effectiveProvider);
    if (resolved) effectiveKey = resolved.key;
  }

  const src = (sourceText || lecture.notesMarkdown || "").trim();
  if (!src) {
    return NextResponse.json(
      { error: "Add lecture notes (or pass sourceText) before generating extras." },
      { status: 400 }
    );
  }

  try {
    const out = await generateLectureExtrasWithMeta(
      lecture.title,
      lecture.subject.name,
      lecture.subject.module?.name ?? "General",
      src,
      wantOverviewCards,
      wantMnemonics,
      wantCases,
      wantMindMaps,
      { preferredProvider: effectiveProvider, customApiKey: effectiveKey }
    );

    if (!dryRun) {
      // Avoid interactive transaction timeouts with large JSON writes.
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT "extras" FROM "Lecture" WHERE "id" = $1 LIMIT 1`,
        lectureId
      )) as Array<{ extras: any }>;
      const prev = (rows?.[0]?.extras ?? {}) as any;
      const next = {
        ...prev,
        ...(wantOverviewCards ? { overviewCards: out.data.overviewCards } : {}),
        ...(wantMnemonics ? { mnemonics: out.data.mnemonics } : {}),
        ...(wantCases ? { cases: out.data.cases } : {}),
        ...(wantMindMaps
          ? {
              mindMapsMarkdown: out.data.mindMapsMarkdown,
              mindMapGraph: out.data.mindMapGraph,
            }
          : {}),
        updatedAt: new Date().toISOString(),
      };
      const nextJson = JSON.stringify(next);
      await prisma.$executeRawUnsafe(
        `UPDATE "Lecture" SET "extras" = $1::jsonb WHERE "id" = $2`,
        nextJson,
        lectureId
      );
    }

    return NextResponse.json({
      ok: true,
      provider: out.meta.provider,
      fallbackFrom: out.meta.fallbackFrom,
      dryRun,
      overviewCards: wantOverviewCards ? out.data.overviewCards.length : 0,
      mnemonics: wantMnemonics ? out.data.mnemonics.length : 0,
      cases: wantCases ? out.data.cases.length : 0,
      mindMaps: wantMindMaps ? Boolean(out.data.mindMapsMarkdown) || (out.data.mindMapGraph?.nodes?.length ?? 0) > 0 : false,
      draft: out.data,
    });
  } catch (e) {
    console.error("[lecture-extras]", e);
    const msg = e instanceof Error ? e.message : "AI failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

