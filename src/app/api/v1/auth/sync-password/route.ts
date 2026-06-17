import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ status: "synced" });
  } catch (error: any) {
    console.error("[SYNC_PASSWORD] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
