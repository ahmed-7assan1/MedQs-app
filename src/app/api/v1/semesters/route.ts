import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all semesters (admin)
export async function GET() {
  const semesters = await prisma.semester.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(semesters);
}
