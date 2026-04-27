import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

function verifyColabSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-colab-secret");
  return secret === process.env.COLAB_WORKER_SECRET;
}

// ── GET: Admin dashboard lists all jobs, OR Colab claims next PENDING job ────
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const isColab = req.headers.get("x-colab-secret") !== null;

  // ── Colab worker: claim next PENDING job ────────────────────────────────────
  if (isColab) {
    if (!verifyColabSecret(req)) {
      return NextResponse.json({ error: "Invalid Colab secret" }, { status: 401 });
    }

    // Mark worker as alive
    const job = await prisma.youtubeUploadTask.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (!job) {
      return NextResponse.json({ job: null });
    }

    // Atomically claim it
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
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const jobs = await prisma.youtubeUploadTask.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Detect if Colab worker is alive (polled in last 3 minutes)
  const latestPoll = jobs.find((j) => j.colabLastPoll);
  const workerAlive = latestPoll?.colabLastPoll
    ? Date.now() - new Date(latestPoll.colabLastPoll).getTime() < 3 * 60 * 1000
    : false;

  return NextResponse.json({ jobs, workerAlive });
}

// ── POST: Admin creates a new transfer job ───────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { sourceUrl, title, lectureVideoId, targetPlaylistId } = await req.json();

  if (!sourceUrl?.trim()) {
    return NextResponse.json({ error: "sourceUrl is required" }, { status: 400 });
  }

  const job = await prisma.youtubeUploadTask.create({
    data: {
      sourceUrl: sourceUrl.trim(),
      title: title?.trim() || sourceUrl.trim(),
      lectureVideoId: lectureVideoId || null,
      targetPlaylistId: targetPlaylistId || null,
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
