import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractQuestionsFromText, validateQuestions } from "@/lib/gemini";
import { redisIncrWithExpire } from "@/lib/redis";

const RATE_LIMIT = 5; // PDF extractions per hour — each can be large

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Rate limit: 5 extractions per hour per admin
  const key = `ratelimit:ai:extract:${session!.user!.id}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(key, 3600);
  if (count > RATE_LIMIT) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Max ${RATE_LIMIT} PDF extractions per hour.` },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: "Max file size 20MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (file.name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (file.name.endsWith(".docx")) {
    text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, " ");
  } else {
    return NextResponse.json({ error: "Only PDF and DOCX supported" }, { status: 400 });
  }

  if (!text.trim()) return NextResponse.json({ questions: [], issues: [] });

  const questions = await extractQuestionsFromText(text);
  const issues = await validateQuestions(
    questions.map(q => ({ body: q.body, answer: q.answer }))
  );

  return NextResponse.json({ questions, issues });
}
