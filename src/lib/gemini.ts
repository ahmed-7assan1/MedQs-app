import {
  type AIProviderId,
  generateAIReplyWithFallback,
  generateJsonWithFallback,
  type AIFallbackMeta,
} from "./ai-router";
import { geminiModelChain } from "./gemini-model-chain";

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

export type AIRequestOptions = { preferredProvider?: AIProviderId | string };
export type AIWithMeta<T> = { data: T; meta: AIFallbackMeta };

// ─── 1. Student: explain a question ──────────────────────────────────────────

export async function generateExplanation(
  questionBody: string,
  choices: { key: string; text: string }[],
  answer: string,
  options?: AIRequestOptions
): Promise<string> {
  const out = await generateExplanationWithMeta(questionBody, choices, answer, options);
  return out.data;
}

export async function generateExplanationWithMeta(
  questionBody: string,
  choices: { key: string; text: string }[],
  answer: string,
  options?: AIRequestOptions
): Promise<AIWithMeta<string>> {
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

  const row = await generateAIReplyWithFallback(prompt, "You are a medical education tutor.", {
    preferredProvider: options?.preferredProvider,
  });
  return {
    data: row.text || "Explanation unavailable.",
    meta: { provider: row.provider, fallbackFrom: row.fallbackFrom, triedProviders: row.triedProviders },
  };
}

// ─── 2. Admin: suggest choices + answer for a question body ──────────────────

export async function suggestQuestionDetails(
  questionBody: string,
  options?: AIRequestOptions
): Promise<AISuggestion> {
  const out = await suggestQuestionDetailsWithMeta(questionBody, options);
  return out.data;
}

export async function suggestQuestionDetailsWithMeta(
  questionBody: string,
  options?: AIRequestOptions
): Promise<AIWithMeta<AISuggestion>> {
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

  const fallback: AISuggestion = {
    choices: [
      { key: "A", text: "Option A" },
      { key: "B", text: "Option B" },
      { key: "C", text: "Option C" },
      { key: "D", text: "Option D" },
    ],
    answer: "A",
    explanation: "Could not generate suggestion. Please fill manually.",
    difficulty: "MEDIUM",
  };
  const row = await generateJsonWithFallback<AISuggestion>(prompt, fallback, {
    preferredProvider: options?.preferredProvider,
  });
  return { data: row.data, meta: { provider: row.provider, fallbackFrom: row.fallbackFrom, triedProviders: row.triedProviders } };
}

// ─── 3. Admin: extract questions from raw text ────────────────────────────────

export async function extractQuestionsFromText(
  text: string,
  options?: AIRequestOptions
): Promise<ExtractedQuestion[]> {
  const out = await extractQuestionsFromTextWithMeta(text, options);
  return out.data;
}

export async function extractQuestionsFromTextWithMeta(
  text: string,
  options?: AIRequestOptions
): Promise<AIWithMeta<ExtractedQuestion[]>> {
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

  const row = await generateJsonWithFallback<{ questions: ExtractedQuestion[] }>(prompt, { questions: [] }, {
    preferredProvider: options?.preferredProvider,
  });
  return {
    data: row.data.questions ?? [],
    meta: { provider: row.provider, fallbackFrom: row.fallbackFrom, triedProviders: row.triedProviders },
  };
}

// ─── 4. Admin: validate questions for quality issues ─────────────────────────

export async function validateQuestions(
  questions: { body: string; answer: string }[],
  options?: AIRequestOptions
): Promise<{ index: number; issue: string }[]> {
  const out = await validateQuestionsWithMeta(questions, options);
  return out.data;
}

export async function validateQuestionsWithMeta(
  questions: { body: string; answer: string }[],
  options?: AIRequestOptions
): Promise<AIWithMeta<{ index: number; issue: string }[]>> {
  if (questions.length === 0) {
    return { data: [], meta: { provider: "local:none", triedProviders: [] } };
  }

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

  const row = await generateJsonWithFallback<{ issues: { index: number; issue: string }[] }>(prompt, { issues: [] }, {
    preferredProvider: options?.preferredProvider,
  });
  return {
    data: row.data.issues ?? [],
    meta: { provider: row.provider, fallbackFrom: row.fallbackFrom, triedProviders: row.triedProviders },
  };
}

// ─── 5. Admin: lecture notes + flashcards (AI Tools) ──────────────────────────

export async function generateLectureEnhancements(
  lectureTitle: string,
  subjectName: string,
  moduleName: string,
  instructions: string,
  wantNotes: boolean,
  wantFlashcards: boolean,
  options?: AIRequestOptions
): Promise<{ notesMarkdown: string; flashcards: { front: string; back: string }[] }> {
  const out = await generateLectureEnhancementsWithMeta(
    lectureTitle,
    subjectName,
    moduleName,
    instructions,
    wantNotes,
    wantFlashcards,
    options
  );
  return out.data;
}

export async function generateLectureEnhancementsWithMeta(
  lectureTitle: string,
  subjectName: string,
  moduleName: string,
  instructions: string,
  wantNotes: boolean,
  wantFlashcards: boolean,
  options?: AIRequestOptions
): Promise<AIWithMeta<{ notesMarkdown: string; flashcards: { front: string; back: string }[] }>> {
  const prompt = `You assist medical educators.

Lecture title: ${lectureTitle}
Subject: ${subjectName}
Module: ${moduleName}

Teacher instructions (what to focus on):
${instructions.trim() || "Summarize high-yield exam-relevant concepts."}

Return ONLY valid JSON:
{
  "notesMarkdown": "markdown string or empty",
  "flashcards": [{"front":"...","back":"..."}]
}

Rules:
- If the teacher does not need study notes, set notesMarkdown to "".
- If the teacher does not need flashcards, set flashcards to [].
- notesMarkdown: use ## headings, bullet lists, bold key terms; concise.
- flashcards: 6–24 cards if requested, else []; short Q/A style; medically accurate.
- wantNotes this run: ${wantNotes}
- wantFlashcards this run: ${wantFlashcards}`;

  const row = await generateJsonWithFallback<{ notesMarkdown?: string; flashcards?: { front: string; back: string }[] }>(
    prompt,
    { notesMarkdown: "", flashcards: [] },
    { preferredProvider: options?.preferredProvider }
  );
  const parsed = row.data;
  const notes = wantNotes ? String(parsed.notesMarkdown ?? "").trim() : "";
  const cards = wantFlashcards
    ? (parsed.flashcards ?? [])
        .filter((f) => f && String(f.front).trim() && String(f.back).trim())
        .map((f) => ({
          front: String(f.front).trim().slice(0, 500),
          back: String(f.back).trim().slice(0, 1000),
        }))
        .slice(0, 40)
    : [];
  return {
    data: { notesMarkdown: notes, flashcards: cards },
    meta: { provider: row.provider, fallbackFrom: row.fallbackFrom, triedProviders: row.triedProviders },
  };
}

// ─── 5b. Student: flashcards from pasted notes (preview / export — not saved to DB) ─

export async function generateFlashcardsFromPastedText(
  text: string,
  focusHint: string,
  options?: AIRequestOptions
): Promise<{ front: string; back: string }[]> {
  const out = await generateFlashcardsFromPastedTextWithMeta(text, focusHint, options);
  return out.data;
}

export async function generateFlashcardsFromPastedTextWithMeta(
  text: string,
  focusHint: string,
  options?: AIRequestOptions
): Promise<AIWithMeta<{ front: string; back: string }[]>> {
  const body = text.trim().slice(0, 12_000);
  const focus = (focusHint || "").trim().slice(0, 500);

  const prompt = `You help medical students turn their own study notes into flashcards.

RULES:
- Use ONLY information that appears in the STUDY MATERIAL below. Do not add facts, doses, or protocols that are not supported by that text.
- If the text is short, produce fewer cards (minimum 4 if there is enough content, otherwise as many as justified).
- Maximum 20 cards.
- Front: short question, prompt, or term (one line).
- Back: concise answer (1–3 sentences).
- Match the language of the study material (e.g. Arabic notes → Arabic cards).

STUDY MATERIAL:
${body}

${focus ? `Student asked to emphasize: ${focus}\n` : ""}

Return ONLY valid JSON:
{"flashcards":[{"front":"...","back":"..."}]}`;

  const row = await generateJsonWithFallback<{ flashcards?: { front: string; back: string }[] }>(
    prompt,
    { flashcards: [] },
    { preferredProvider: options?.preferredProvider }
  );
  const cards = (row.data.flashcards ?? [])
    .filter((f) => f && String(f.front).trim() && String(f.back).trim())
    .map((f) => ({
      front: String(f.front).trim().slice(0, 500),
      back: String(f.back).trim().slice(0, 1200),
    }))
    .slice(0, 20);
  return {
    data: cards,
    meta: { provider: row.provider, fallbackFrom: row.fallbackFrom, triedProviders: row.triedProviders },
  };
}

// ─── 6. Gemini rate limit info ────────────────────────────────────────────────

export const GEMINI_LIMITS = {
  model: geminiModelChain()[0] ?? "gemini-2.5-flash",
  rpm: 15,        // requests per minute (free tier)
  tpd: 1_000_000, // tokens per day (free tier)
  rpd: 1_500,     // requests per day (free tier)
  note: "Free tier — no billing required. Upgrade to pay-as-you-go for higher limits.",
};
