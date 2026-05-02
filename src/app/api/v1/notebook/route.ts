import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lectureId = searchParams.get("lectureId");
  if (!lectureId) return NextResponse.json({ error: "Missing lectureId" }, { status: 400 });

  try {
    const note = await prisma.note.findFirst({
      where: {
        userId: session.user.id,
        lectureId,
      },
    });
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { lectureId, content } = await req.json();
    if (!lectureId) return NextResponse.json({ error: "Missing lectureId" }, { status: 400 });

    const note = await prisma.note.upsert({
      where: {
        userId_lectureId: {
          userId: session.user.id,
          lectureId,
        },
      },
      update: {
        content,
      },
      create: {
        userId: session.user.id,
        lectureId,
        content,
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("[notebook-api] POST error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
