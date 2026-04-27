import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verifyColabSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-colab-secret");
  return !!secret && secret === process.env.COLAB_WORKER_SECRET;
}

// ── PATCH: Colab updates a job's status, progress, logs, newVideoUrl ─────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyColabSecret(req)) {
    return NextResponse.json({ error: "Invalid Colab secret" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { status, progress, newVideoUrl, error, logs } = body;

  const existing = await prisma.youtubeUploadTask.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Merge new log lines with existing
  let mergedLogs: string[] = [];
  try { mergedLogs = JSON.parse(existing.logs || "[]"); } catch { mergedLogs = []; }
  if (Array.isArray(logs)) mergedLogs = [...mergedLogs, ...logs];
  // Keep last 200 log lines
  if (mergedLogs.length > 200) mergedLogs = mergedLogs.slice(-200);

  const updated = await prisma.youtubeUploadTask.update({
    where: { id },
    data: {
      status: status || existing.status,
      progress: progress !== undefined ? Math.min(100, Math.max(0, Number(progress))) : existing.progress,
      newVideoUrl: newVideoUrl || existing.newVideoUrl,
      error: error || existing.error,
      logs: JSON.stringify(mergedLogs),
      colabLastPoll: new Date(),
    },
  });

  // ── If completed and linked to a LectureVideo, auto-update its URL ──────────
  if (updated.status === "COMPLETED" && updated.newVideoUrl && updated.lectureVideoId) {
    try {
      await prisma.lectureVideo.update({
        where: { id: updated.lectureVideoId },
        data: { url: updated.newVideoUrl, sourceType: "internal" },
      });
      console.log(`[colab] Auto-updated LectureVideo ${updated.lectureVideoId} → ${updated.newVideoUrl}`);
    } catch (e) {
      console.error(`[colab] Failed to update LectureVideo:`, e);
    }
  }

  return NextResponse.json({ ok: true, job: updated });
}

// ── GET: Poll a single job's status (for live progress in admin UI) ───────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const job = await prisma.youtubeUploadTask.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}
