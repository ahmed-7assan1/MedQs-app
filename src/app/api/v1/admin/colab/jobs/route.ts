import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

// ── GET: Admin dashboard lists all jobs, OR Colab claims next PENDING job ────
export async function GET(req: NextRequest) {
  const isColab = req.headers.get("x-colab-secret") !== null || req.url.includes("colab=true");

  // ── Colab worker: claim next PENDING job ────────────────────────────────────
  if (isColab) {
    const job = await prisma.youtubeUploadTask.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (!job) return NextResponse.json({ job: null });

    const claimed = await prisma.youtubeUploadTask.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        colabLastPoll: new Date(),
        logs: JSON.stringify([`[${new Date().toISOString()}] Job claimed by Colab worker`]),
      },
    });

    return NextResponse.json({ job: claimed });
  }

  // ── Admin dashboard: list all jobs ─────────────────────────────────────────
  try {
    const session = await auth();
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;

    const jobs = await prisma.youtubeUploadTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const polledJobs = jobs.filter(j => j.colabLastPoll);
    const latestPoll = polledJobs.length > 0 ? polledJobs[0].colabLastPoll : null;
    const workerAlive = latestPoll ? Date.now() - new Date(latestPoll).getTime() < 5 * 60 * 1000 : false;

    return NextResponse.json({ jobs, workerAlive });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── POST: Admin or Colab creates a job ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const { sourceUrl, title, lectureVideoId, targetPlaylistId, metadata } = await req.json();

  if (!sourceUrl?.trim()) {
    return NextResponse.json({ error: "sourceUrl is required" }, { status: 400 });
  }

  const job = await prisma.youtubeUploadTask.create({
    data: {
      sourceUrl: sourceUrl.trim(),
      title: title?.trim() || sourceUrl.trim(),
      lectureVideoId: lectureVideoId || null,
      targetPlaylistId: targetPlaylistId || null,
      entityId: metadata ? JSON.stringify(metadata) : null,
      status: "PENDING",
    },
  });

  return NextResponse.json({ job }, { status: 201 });
}

// ── DELETE: Admin cancels / clears completed jobs ────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { ids, clearCompleted } = await req.json();

  if (clearCompleted) {
    await prisma.youtubeUploadTask.deleteMany({
      where: { status: { in: ["COMPLETED", "FAILED"] } },
    });
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(ids) && ids.length > 0) {
    await prisma.youtubeUploadTask.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "No action" }, { status: 400 });
}
