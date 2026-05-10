import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Delete posts that are more than 7 days old and belong to a StudyRoom (not GLOBAL/SEMESTER/PRIVATE forums)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deleted = await prisma.post.deleteMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
        roomId: { not: null }, // Only room-specific discussions
      },
    });

    return NextResponse.json({ success: true, deletedCount: deleted.count });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Cleanup failed" }, { status: 500 });
  }
}
