import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

function verifyColabSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-colab-secret")?.trim();
  const expected = process.env.COLAB_WORKER_SECRET?.trim();
  if (!secret || !expected) return false;
  return secret === expected;
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
  try {
    const session = await auth();
    const w = await requireAdminWriter(session);
    if (!w.ok) {
      console.error("[colab-api] Admin check failed:", w.ok);
      return w.response;
    }

    const jobs = await prisma.youtubeUploadTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Detect if Colab worker is alive (polled in last 5 minutes)
    // We check for jobs that have a colabLastPoll value
    const polledJobs = jobs.filter(j => j.colabLastPoll);
    const latestPoll = polledJobs.length > 0 ? polledJobs[0].colabLastPoll : null;
    
    const workerAlive = latestPoll
      ? Date.now() - new Date(latestPoll).getTime() < 5 * 60 * 1000
      : false;

    return NextResponse.json({ jobs, workerAlive });
  } catch (error: any) {
    console.error("[colab-api] GET error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}


// ── POST: Admin creates a new transfer job, OR Colab creates bulk jobs ──────
export async function POST(req: NextRequest) {
  const isColab = req.headers.get("x-colab-secret") !== null;
  
  if (isColab) {
    if (!verifyColabSecret(req)) {
      return NextResponse.json({ error: "Invalid Colab secret" }, { status: 401 });
    }
  } else {
    const session = await auth();
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;
  }

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
