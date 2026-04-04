import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";

// POST /api/v1/lectures/:id/files  (multipart/form-data, field "file")
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.lecture.includes(file.type))
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE.lecture)
    return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, key } = await uploadFile(buffer, file.name, file.type, "lecture");

  const lectureFile = await prisma.lectureFile.create({
    data: {
      lectureId: params.id,
      name: file.name,
      url,
      mimeType: file.type,
    },
  });

  return NextResponse.json(lectureFile, { status: 201 });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const files = await prisma.lectureFile.findMany({ where: { lectureId: params.id } });
  return NextResponse.json(files);
}
