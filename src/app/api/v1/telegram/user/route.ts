import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("id");

    if (!telegramId) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const user = await (prisma.user as any).findFirst({
      where: { telegramId: telegramId.toString() },
      include: {
        university: true,
        semester: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      points: user.points,
      university: user.university?.name || "Medical Student",
      role: user.role,
      image: user.image,
    });
  } catch (err: any) {
    console.error("[API-TMA-USER] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
