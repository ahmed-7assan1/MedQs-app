import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const tasks = await prisma.youtubeUploadTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching sync tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sourceUrl, targetPlaylistId } = body;

    if (!sourceUrl) {
      return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
    }

    const task = await prisma.youtubeUploadTask.create({
      data: {
        sourceUrl,
        targetPlaylistId: targetPlaylistId || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating sync task:", error);
    return NextResponse.json(
      { error: "Failed to create sync task" },
      { status: 500 }
    );
  }
}
