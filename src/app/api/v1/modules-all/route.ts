import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/v1/modules-all - all modules for admin tree view
export async function GET() {
  const modules = await prisma.module.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(modules);
}
