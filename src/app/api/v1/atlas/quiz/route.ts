import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry, getGeminiApiKeys } from "@/lib/gemini-keys";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { systemId, structureId } = await req.json();

    let targetName = "Human Anatomy";
    let targetContext = "";

    if (structureId) {
      const struct = await (prisma as any).atlasStructure.findUnique({
        where: { id: structureId },
        include: { system: true }
      });
      if (struct) {
        targetName = struct.name;
        targetContext = `Structure: ${struct.name} (${struct.latin || ""})
System: ${struct.system.label}
Description: ${struct.desc}
Function: ${struct.fn || ""}
Blood Supply: ${struct.blood || ""}
Innervation: ${struct.nerve || ""}
Clinical Significance: ${struct.clinical || ""}`;
      }
    } else if (systemId) {
      const sys = await (prisma as any).atlasSystem.findUnique({
        where: { systemId },
        include: { structures: true }
      });
      if (sys) {
        targetName = sys.label;
        targetContext = `System: ${sys.label}
Description: ${sys.desc}
Structures in this system: ${sys.structures.map((s: any) => s.name).join(", ")}`;
      }
    }

    const persistentGeminiKey = (session.user as any).personalGeminiKey;
    const keys = await getGeminiApiKeys(persistentGeminiKey);
    if (keys.length > 0) {
      try {
        const prompt = `You are a professional medical school professor.
Generate 5 high-yield clinical multiple-choice questions (MCQs) for a medical student about: ${targetName}.

Context details to incorporate:
${targetContext}

Requirements:
- Each question must have exactly 4 choices (A, B, C, D).
- One correct answer (0, 1, 2, or 3 representing the index).
- Include a medically detailed explanation for why the answer is correct and why other choices are wrong.
- Must return ONLY a valid JSON array matching this format (no markdown code blocks, just raw JSON text or inside \`\`\`json):
[
  {
    "question": "A 45-year-old male presents with...",
    "choices": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 1,
    "explanation": "Option B is correct because..."
  }
]`;

        const geminiResult = await callGeminiWithRetry(async (key) => {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          return await model.generateContent(prompt);
        }, persistentGeminiKey);
        let text = geminiResult.response.text().trim();
        
        if (text.startsWith("```json")) {
          text = text.substring(7);
        }
        if (text.endsWith("```")) {
          text = text.substring(0, text.length - 3);
        }
        text = text.trim();

        const questions = JSON.parse(text);
        return NextResponse.json({ source: "gemini", questions });
      } catch (geminiError) {
        console.error("[ATLAS_QUIZ] Gemini failed, falling back to static questions:", geminiError);
      }
    }

    // Static fallback questions
    const staticQuestions = [
      {
        question: `Which of the following best describes the primary functional role or common clinical presentation associated with: ${targetName}?`,
        choices: [
          "It acts as a primary regulatory metabolic center with minimal clinical vulnerability.",
          "It presents with direct acute functional deficits or specific referred pain paths upon localized trauma or pathology.",
          "It is strictly a mechanical supportive structure with no active vascular or nerve relationships.",
          "Its functions are fully compensated by adjacent structures with zero clinical significance."
        ],
        answerIndex: 1,
        explanation: `${targetName} is deeply integrated anatomically. Localized trauma, ischemia, or compression leads to direct, highly specific clinical presentations (such as referred pain or specialized motor/sensory deficits).`
      },
      {
        question: `A student is reviewing the anatomical relations of ${targetName}. Which statement is anatomically correct?`,
        choices: [
          "It operates in complete physical and physiological isolation from surrounding systems.",
          "Its blood supply and innervation are entirely unilateral and uniform across all individuals.",
          "Its relative spatial boundaries dictate important pathological spread patterns to adjacent organs.",
          "It lacks any protective tissue layers or fascial coverings."
        ],
        answerIndex: 2,
        explanation: "Anatomical structures do not exist in isolation. Understanding spatial relations (e.g. mediastinal, cranial, or retroperitoneal boundaries) is critical for predicting tumor invasion or infectious spread."
      },
      {
        question: `In clinical diagnostics, assessing the integrity of ${targetName} usually starts with:`,
        choices: [
          "Immediate high-dose systemic radiotherapy.",
          "A detailed history and physical examination, supplemented by targeted imaging (X-ray, CT, or MRI) depending on the tissue type.",
          "An invasive exploratory surgical intervention without prior non-invasive testing.",
          "Generalized diagnostic laboratory panels with no anatomical specificity."
        ],
        answerIndex: 1,
        explanation: "Clinical workups always prioritize non-invasive assessment starting with precise history, physical signs (like auscultation, palpation or neurological tests), followed by localized imaging."
      }
    ];

    return NextResponse.json({ source: "fallback", questions: staticQuestions });
  } catch (error: any) {
    console.error("[ATLAS_QUIZ_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate quiz questions" }, { status: 500 });
  }
}
