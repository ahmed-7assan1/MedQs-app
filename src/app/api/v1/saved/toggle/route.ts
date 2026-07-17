import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { itemType, itemId } = await req.json();
    if (!itemType || !itemId) {
      return NextResponse.json({ error: "Missing itemType or itemId" }, { status: 400 });
    }

    const existing = await prisma.userSavedItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: session.user.id,
          itemType,
          itemId,
        },
      },
    });

    if (existing) {
      await prisma.userSavedItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await prisma.userSavedItem.create({
      data: { userId: session.user.id, itemType, itemId },
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[SAVED_TOGGLE]", error);
    return NextResponse.json({ error: "Failed to toggle save" }, { status: 500 });
  }
}
