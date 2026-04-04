import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invites = await prisma.privateForumInvite.findMany({
    where: {
      receiverId: session.user.id,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      forum: { select: { id: true, name: true } },
      sender: { select: { id: true, name: true, nickname: true, image: true } },
    },
  });

  return NextResponse.json(invites);
}
