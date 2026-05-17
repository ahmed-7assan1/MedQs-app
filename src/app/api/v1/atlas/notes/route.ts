import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const structureId = searchParams.get("structureId");
    if (!structureId) return NextResponse.json({ error: "Missing structureId" }, { status: 400 });

    const note = await prisma.atlasNote.findUnique({
      where: {
        userId_structureId: {
          userId: session.user.id,
          structureId
        }
      }
    });

    return NextResponse.json({ content: note?.content || "" });
  } catch (error: any) {
    console.error("[ATLAS_NOTE_GET]", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { structureId, content } = await req.json();
    if (!structureId) return NextResponse.json({ error: "Missing structureId" }, { status: 400 });

    if (!content || content.trim() === "") {
      // If content is empty, delete the note
      await prisma.atlasNote.deleteMany({
        where: {
          userId: session.user.id,
          structureId
        }
      });
      return NextResponse.json({ success: true, message: "Note cleared" });
    }

    const note = await prisma.atlasNote.upsert({
      where: {
        userId_structureId: {
          userId: session.user.id,
          structureId
        }
      },
      update: {
        content: content.trim()
      },
      create: {
        userId: session.user.id,
        structureId,
        content: content.trim()
      }
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error("[ATLAS_NOTE_POST]", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
