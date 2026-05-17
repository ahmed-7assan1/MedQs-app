import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const structureId = searchParams.get("structureId");

    if (structureId) {
      const bookmark = await prisma.atlasBookmark.findUnique({
        where: {
          userId_structureId: {
            userId: session.user.id,
            structureId,
          }
        }
      });
      return NextResponse.json({ bookmarked: !!bookmark });
    }

    const bookmarks = await prisma.atlasBookmark.findMany({
      where: { userId: session.user.id },
      include: {
        structure: {
          include: {
            system: true
          }
        }
      }
    });

    return NextResponse.json(bookmarks);
  } catch (error: any) {
    console.error("[ATLAS_BOOKMARKS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { structureId } = await req.json();
    if (!structureId) return NextResponse.json({ error: "Missing structureId" }, { status: 400 });

    const existing = await prisma.atlasBookmark.findUnique({
      where: {
        userId_structureId: {
          userId: session.user.id,
          structureId
        }
      }
    });

    if (existing) {
      await prisma.atlasBookmark.delete({
        where: {
          userId_structureId: {
            userId: session.user.id,
            structureId
          }
        }
      });
      return NextResponse.json({ bookmarked: false, message: "Bookmark removed" });
    } else {
      await prisma.atlasBookmark.create({
        data: {
          userId: session.user.id,
          structureId
        }
      });
      return NextResponse.json({ bookmarked: true, message: "Bookmark added" });
    }
  } catch (error: any) {
    console.error("[ATLAS_BOOKMARKS_TOGGLE]", error);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}
