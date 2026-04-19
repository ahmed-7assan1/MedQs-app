import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";
import { generateJsonWithFallback } from "@/lib/ai-router";
import pdf from "pdf-parse";

export const maxDuration = 300; // Extend duration for large PDF processing

export async function GET(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { searchParams } = new URL(req.url);
  const facultyId = searchParams.get("facultyId");

  if (!facultyId) {
    return NextResponse.json({ error: "Faculty ID is required" }, { status: 400 });
  }

  const books = await (prisma as any).sourceBook.findMany({
    where: { facultyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      createdAt: true,
      analysisJson: true,
    }
  });

  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const { searchParams } = new URL(req.url);
    const facultyId = formData.get("facultyId") as string;

    if (!file || !facultyId) {
      return NextResponse.json({ error: "File and Faculty ID are required" }, { status: 400 });
    }

    // 1. Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let fullText = "";
    try {
      const pdfData = await pdf(buffer);
      fullText = pdfData.text;
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse PDF content: " + (e as Error).message }, { status: 400 });
    }

    // 2. Sample text if too large (medical books are huge)
    const sampleText = fullText.slice(0, 50000);

    // 3. Use established AI router (standardized fallbacks)
    const prompt = `
      You are a medical education AI. You have been provided with text from a specific medical Module Textbook.
      Your goal is to extract the academic SUBJECTS (المواد العلمية) covered in this book (e.g., Anatomy, Physiology, Pathology, Biochemistry, Microbiology, Pharmacology, etc.) 
      and the major TOPICS/CHAPTERS under each subject.

      Important: This book belongs to ONE module. Do not extract modules; instead, focus on the academic disciplines (Subjects) within it.

      Output ONLY valid JSON:
      {
        "title": "Book Title",
        "author": "Estimated Author",
        "subjects": [
          {
            "name": "Subject Name (e.g., Anatomy)",
            "topics": ["Topic 1 (e.g., Embryology of Heart)", "Topic 2 (e.g., Valves structure)"]
          }
        ]
      }

      Text Sample:
      ${sampleText}
    `;

    const fallback = { title: file.name, author: "Unknown", subjects: [] };
    const aiResult = await generateJsonWithFallback<any>(prompt, fallback);

    // 4. Save to Database
    const sourceBook = await (prisma as any).sourceBook.create({
      data: {
        title: aiResult.data.title || file.name,
        author: aiResult.data.author || "Unknown",
        fullText: fullText.slice(0, 100000), 
        analysisJson: aiResult.data,
        facultyId,
      }
    });

    return NextResponse.json({ success: true, sourceBook, provider: aiResult.provider });
  } catch (error) {
    console.error("[POST book-analyze]", error);
    return NextResponse.json({ error: "Failed to analyze book: " + (error as Error).message }, { status: 500 });
  }
}
