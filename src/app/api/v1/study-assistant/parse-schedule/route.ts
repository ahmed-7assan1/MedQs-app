import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ocrImageBuffer } from "@/lib/ocr";

/**
 * POST multipart: file (PDF, image, or .txt) → extracted text for timetable paste.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null) as any;
  const file = formData?.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Max file size 20MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let text = "";

  try {
    if (name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      text = parsed.text || "";
    } else if (/\.(png|jpe?g|webp|gif)$/.test(name)) {
      text = (await ocrImageBuffer(buffer)) || "";
    } else if (name.endsWith(".txt") || file.type === "text/plain") {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Supported: PDF, PNG/JPEG/WebP/GIF, or .txt" }, { status: 400 });
    }
  } catch (e) {
    console.error("[parse-schedule]", e);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }

  const t = text.replace(/\u0000/g, "").trim();
  if (!t) {
    return NextResponse.json({ error: "No text extracted — try a clearer scan or paste text manually." }, { status: 422 });
  }

  return NextResponse.json({ text: t });
}
