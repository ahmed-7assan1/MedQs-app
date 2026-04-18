import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { generateLectureExtrasWithMeta } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

async function fileToText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    return parsed.text ?? "";
  }
  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, " ");
  }
  return buffer.toString("utf-8");
}

function normalizePreferredProvider(raw: unknown): "gemini" | "openai" | "anthropic" | "deepseek" | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (s === "gemini" || s === "openai" || s === "anthropic" || s === "deepseek") return s;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;

    const site = await prisma.siteConfig.findFirst({ select: { enableAI: true, aiPreferredProvider: true } });
    if (site && site.enableAI === false) {
      return NextResponse.json({ error: "AI is disabled in Site Settings" }, { status: 400 });
    }

    const form = await req.formData();
    const lectureId = String(form.get("lectureId") ?? "").trim();
    const wantOverviewCards = String(form.get("overviewCards") ?? "") === "1";
    const wantMnemonics = String(form.get("mnemonics") ?? "") === "1";
    const wantCases = String(form.get("cases") ?? "") === "1";
    const wantMindMaps = String(form.get("mindMaps") ?? "") === "1";
    const preferredProvider = String(form.get("preferredProvider") ?? "").trim() || undefined;
    const dryRun = String(form.get("dryRun") ?? "") === "1";

    const file = form.get("file") as File | null;
    if (!lectureId) return NextResponse.json({ error: "lectureId required" }, { status: 400 });
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
    if (!wantOverviewCards && !wantMnemonics && !wantCases && !wantMindMaps) {
      return NextResponse.json({ error: "Select at least one output" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Max file size 20MB" }, { status: 400 });

    const boundary = await assertLecture(w.scope, lectureId);
    if (boundary) return boundary;

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { subject: { select: { name: true, module: { select: { name: true } } } } },
    });
    if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

    const text = (await fileToText(file)).trim();
    if (!text) return NextResponse.json({ error: "File contained no readable text" }, { status: 422 });

    const effectiveProvider =
      normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);

    const out = await generateLectureExtrasWithMeta(
      lecture.title,
      lecture.subject.name,
      lecture.subject.module?.name ?? "General",
      text,
      wantOverviewCards,
      wantMnemonics,
      wantCases,
      wantMindMaps,
      { preferredProvider: effectiveProvider }
    );

    if (!dryRun) {
      // Avoid interactive transaction timeouts with large JSON writes.
      const rows = await prisma.$queryRaw<Array<{ extras: any }>>(
        Prisma.sql`SELECT "extras" FROM "Lecture" WHERE "id" = ${lectureId} LIMIT 1`
      );
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
        source: { type: "file", name: file.name, size: file.size },
      };
      const nextJson = JSON.stringify(next);
      await prisma.$executeRaw(
        Prisma.sql`UPDATE "Lecture" SET "extras" = ${nextJson}::jsonb WHERE "id" = ${lectureId}`
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
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

