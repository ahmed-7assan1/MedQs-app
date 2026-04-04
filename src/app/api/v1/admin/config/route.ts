import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.siteConfig.findFirst();
  return NextResponse.json(config ?? {});
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();

  const config = await prisma.siteConfig.upsert({
    where: { id: (await prisma.siteConfig.findFirst())?.id ?? "default" },
    create: data,
    update: data,
  });

  return NextResponse.json(config);
}
