import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ exists: false, error: "Email is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    return NextResponse.json({ exists: !!user });
  } catch {
    return NextResponse.json({ exists: false, error: "Server error" }, { status: 500 });
  }
}
