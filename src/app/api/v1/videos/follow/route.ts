import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await req.json();

  try {
    const existing = await (prisma as any).channelFollow.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId: channelId
        }
      }
    });

    if (existing) {
      await (prisma as any).channelFollow.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ following: false });
    } else {
      await (prisma as any).channelFollow.create({
        data: {
          userId: session.user.id,
          channelId: channelId
        }
      });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
