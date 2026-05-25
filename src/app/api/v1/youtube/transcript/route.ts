import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry } from "@/lib/gemini-keys";

export async function POST(req: NextRequest) {
  const { videoUrl, lectureId } = await req.json();

  if (!videoUrl) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    if (lectureId) {
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        select: { notesMarkdown: true }
      });
      if (lecture?.notesMarkdown && lecture.notesMarkdown.length > 100) {
        return NextResponse.json({ summary: lecture.notesMarkdown, cached: true });
      }
    }

    let transcriptText = "";
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
      transcriptText = transcript.map(t => t.text).join(" ");
    } catch (e) {
      return NextResponse.json({ error: "No transcript found for this video. AI summary requires closed captions." }, { status: 404 });
    }

    if (!transcriptText || transcriptText.length < 50) {
      return NextResponse.json({ error: "Transcript is too short to summarize." }, { status: 400 });
    }

    const prompt = `
      You are an expert medical educator. Below is a transcript of a medical lecture.
      Please generate a comprehensive, high-yield summary of the lecture in Markdown format.
      
      Requirements:
      1. Use Arabic (اللغة العربية) as the primary language, but keep medical terms in English.
      2. Group the info into clear sections (Overview, Key Concepts, Clinical Signficance, Mnemonics).
      3. Classify the lecture into a medical subject (e.g., Cardiology, Anatomy, Biochemistry) and include this as a tag at the top.
      4. Use bolding and bullet points for readability.
      5. Focus on concepts most relevant for USMLE/PLAB and academic medical exams.
      
      Transcript:
      ${transcriptText.substring(0, 30000)}
    `;

    const result = await callGeminiWithRetry(async (key) => {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      return await model.generateContent(prompt);
    });
    const summary = result.response.text();

    if (lectureId) {
      await prisma.lecture.update({
        where: { id: lectureId },
        data: { notesMarkdown: summary }
      });
    }

    return NextResponse.json({ summary, cached: false });
  } catch (error: any) {
    console.error("AI Summary Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}
