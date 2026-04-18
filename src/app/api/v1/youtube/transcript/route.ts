import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const { videoUrl, lectureId } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!videoUrl || !apiKey) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    // 1. Caching Check: Has this lecture been summarized already?
    if (lectureId) {
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        select: { notesMarkdown: true }
      });
      if (lecture?.notesMarkdown && lecture.notesMarkdown.length > 100) {
        return NextResponse.json({ summary: lecture.notesMarkdown, cached: true });
      }
    }

    // 2. Fetch Transcript from YouTube
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

    // 3. Prompt Gemini AI for a High-Yield Medical Summary
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
      You are an expert medical educator. Below is a transcript of a medical lecture.
      Please generate a comprehensive, high-yield summary of the lecture in Markdown format.
      
      Requirements:
      1. Use Arabic (اللغة العربية) as the primary language, but keep medical terms in English and Arabic where appropriate.
      2. Group the info into clear sections (Overview, Key Concepts, Clinical Signficance, Mnemonics).
      3. Use bolding and bullet points for readability.
      4. Focus on what is most likely to be tested in medical exams.
      
      Transcript:
      ${transcriptText.substring(0, 30000)} // Limit to 30k chars for stability
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // 4. Update Database (Global Cache)
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
