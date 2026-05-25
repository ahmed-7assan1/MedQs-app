import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry, getGeminiApiKeys } from "@/lib/gemini-keys";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { message, history = [], structureId, systemId } = await req.json();
    if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 });

    let contextText = "";
    if (structureId) {
      const struct = await prisma.atlasStructure.findUnique({
        where: { id: structureId },
        include: { system: true }
      });
      if (struct) {
        contextText = `[User is viewing Anatomy Structure: ${struct.name} (${struct.latin || ""})
System: ${struct.system.label}
Description: ${struct.desc}
Function: ${struct.fn || ""}
Blood Supply: ${struct.blood || ""}
Innervation: ${struct.nerve || ""}
Clinical Correlations: ${struct.clinical || ""}]`;
      }
    } else if (systemId) {
      const sys = await prisma.atlasSystem.findUnique({
        where: { systemId }
      });
      if (sys) {
        contextText = `[User is viewing Anatomical System: ${sys.label} - ${sys.desc}]`;
      }
    }

    const keys = await getGeminiApiKeys(session.user.personalGeminiKey);
    if (keys.length === 0) {
      return NextResponse.json({
        reply: "Hello! I am your AI Anatomy Tutor. Please configure your Gemini API key in Settings, or ask the admin to enable the platform key to get started!"
      });
    }

    const fullMessage = contextText ? `${contextText}\n\nStudent asks: ${message}` : message;

    const systemPrompt = `You are an expert anatomy professor and AI clinical tutor at a prestigious medical school.
Your goal is to explain anatomical structures, functional mechanisms, neurovascular relations, and clinical significance (such as surgical landmarks, trauma risks, or common pathologies) in a highly pedagogical, clear, and engaging manner.
Use high-yield memory aids (mnemonics) where helpful. Always stay medically accurate and structured.`;

    const result = await callGeminiWithRetry(async (key) => {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      return await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood! I will act as a premium, highly-knowledgeable medical anatomy tutor. Ready to guide students through structural layers, clinical correlations, and high-yield review." }] },
          ...history.map((h: any) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }]
          })),
          { role: "user", parts: [{ text: fullMessage }] }
        ]
      });
    }, session.user.personalGeminiKey);

    const reply = result.response.text();
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("[ATLAS_BOT_CHAT]", error);
    return NextResponse.json({ error: "Failed to communicate with AI tutor" }, { status: 500 });
  }
}
