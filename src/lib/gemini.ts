/**
 * lib/gemini.ts — Google Gemini Flash AI client
 *
 * Uses gemini-2.0-flash-exp (free tier, 15 RPM, 1M TPM, 1500 req/day)
 * Get API key: https://aistudio.google.com/app/apikey (free, no credit card)
 *
 * Env var: GEMINI_API_KEY
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey");
  return new GoogleGenerativeAI(key);
}

const MODEL = "gemini-2.0-flash-exp";

// Relaxed safety settings for medical content
const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedQuestion {
  body: string;
  choices: { key: string; text: string }[];
  answer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface AISuggestion {
  choices: { key: string; text: string }[];
  answer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

// ─── Helper: safe JSON parse from Gemini response ─────────────────────────────

function parseJSON<T>(text: string, fallback: T): T {
  try {
    // Gemini sometimes wraps in ```json ... ```
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}

// ─── 1. Student: explain a question ──────────────────────────────────────────

export async function generateExplanation(
  questionBody: string,
  choices: { key: string; text: string }[],
  answer: string
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL, safetySettings: SAFETY });

  const choiceText = choices.map((c) => `${c.key}. ${c.text}`).join("\n");

  const prompt = `You are a medical education tutor. A student is studying for their exam and needs help understanding this MCQ.

Question: ${questionBody}

Choices:
${choiceText}

Correct answer: ${answer}

Explain in 2-3 short paragraphs:
1. Why the correct answer (${answer}) is right
2. Why the other options are wrong (briefly)
3. A memory tip or mnemonic if helpful

Use simple language suitable for a medical student. Use **bold** for key medical terms. Do not use headers.`;

  const result = await model.generateContent(prompt);
  return result.response.text() ?? "Explanation unavailable.";
}

// ─── 2. Admin: suggest choices + answer for a question body ──────────────────

export async function suggestQuestionDetails(
  questionBody: string
): Promise<AISuggestion> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL,
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a medical exam question writer. Given this question stem, generate 4 plausible answer choices, identify the correct one, write a brief explanation, and assess difficulty.

Question stem: "${questionBody}"

Respond with ONLY valid JSON in this exact format:
{
  "choices": [
    {"key": "A", "text": "..."},
    {"key": "B", "text": "..."},
    {"key": "C", "text": "..."},
    {"key": "D", "text": "..."}
  ],
  "answer": "A",
  "explanation": "Brief explanation of why this is correct...",
  "difficulty": "EASY"
}

Rules:
- One correct answer only
- Other choices must be plausible distractors
- difficulty is "EASY", "MEDIUM", or "HARD"
- Return ONLY the JSON object, no extra text`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON<AISuggestion>(text, {
    choices: [
      { key: "A", text: "Option A" },
      { key: "B", text: "Option B" },
      { key: "C", text: "Option C" },
      { key: "D", text: "Option D" },
    ],
    answer: "A",
    explanation: "Could not generate suggestion. Please fill manually.",
    difficulty: "MEDIUM",
  });
}

// ─── 3. Admin: extract questions from raw text ────────────────────────────────

export async function extractQuestionsFromText(
  text: string
): Promise<ExtractedQuestion[]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL,
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a medical education assistant. Extract ALL multiple-choice questions from the following text.

For each question return a JSON object. Return a JSON array called "questions".

Format:
{
  "questions": [
    {
      "body": "The question text here",
      "choices": [
        {"key": "A", "text": "First option"},
        {"key": "B", "text": "Second option"},
        {"key": "C", "text": "Third option"},
        {"key": "D", "text": "Fourth option"}
      ],
      "answer": "A",
      "explanation": "Brief explanation of the correct answer",
      "difficulty": "EASY"
    }
  ]
}

Rules:
- Extract every question you find
- If the answer is not stated, infer the most likely correct medical answer
- difficulty must be "EASY", "MEDIUM", or "HARD"
- Return ONLY the JSON, no extra text

TEXT TO PROCESS:
${text.slice(0, 15000)}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const parsed = parseJSON<{ questions: ExtractedQuestion[] }>(raw, { questions: [] });
  return parsed.questions ?? [];
}

// ─── 4. Admin: validate questions for quality issues ─────────────────────────

export async function validateQuestions(
  questions: { body: string; answer: string }[]
): Promise<{ index: number; issue: string }[]> {
  if (questions.length === 0) return [];

  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL,
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a quality reviewer for medical exam questions. Review these questions and flag any with issues.

Questions (as JSON array):
${JSON.stringify(questions.slice(0, 30))}

Flag questions that:
- Are too vague or poorly worded
- Have ambiguous correct answers
- Are duplicates of each other (same clinical scenario)
- Are too trivially easy (obvious answer)
- Have grammatical errors

Return ONLY JSON:
{
  "issues": [
    {"index": 0, "issue": "Description of the problem"}
  ]
}

If all questions are fine, return: {"issues": []}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const parsed = parseJSON<{ issues: { index: number; issue: string }[] }>(raw, { issues: [] });
  return parsed.issues ?? [];
}

// ─── 5. Gemini rate limit info ────────────────────────────────────────────────

export const GEMINI_LIMITS = {
  model: MODEL,
  rpm: 15,        // requests per minute (free tier)
  tpd: 1_000_000, // tokens per day (free tier)
  rpd: 1_500,     // requests per day (free tier)
  note: "Free tier — no billing required. Upgrade to pay-as-you-go for higher limits.",
};
