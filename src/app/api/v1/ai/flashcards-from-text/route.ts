import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateFlashcardsFromPastedTextWithMeta } from "@/lib/gemini";

const MIN_CHARS = 80;
const MAX_CHARS = 12_000;

function normalizePreferredProvider(raw: unknown): "gemini" | "openai" | "anthropic" | "deepseek" | "groq" | "openrouter" | "xai" | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (["gemini", "openai", "anthropic", "deepseek", "groq", "openrouter", "xai"].includes(s)) return s as any;
  return undefined;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { getSiteConfig: getCfg } = await import("@/lib/get-site-config");
  const site = await getCfg().catch(() => null);
  if (site?.enableAI === false) {
    return NextResponse.json({ error: "AI features are disabled on this site" }, { status: 403 });
  }

  let body: { text?: string; focus?: string; preferredProvider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const focus = typeof body.focus === "string" ? body.focus : "";
  const preferredProvider = typeof body.preferredProvider === "string" ? body.preferredProvider : "";
  const effectiveProvider =
    normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);

  if (text.trim().length < MIN_CHARS) {
    return NextResponse.json(
      { error: `Paste at least ${MIN_CHARS} characters of notes` },
      { status: 400 }
    );
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `Text must be at most ${MAX_CHARS} characters` }, { status: 400 });
  }

  try {
    const out = await generateFlashcardsFromPastedTextWithMeta(text, focus, { preferredProvider: effectiveProvider });
    const flashcards = out.data;
    if (flashcards.length === 0) {
      return NextResponse.json(
        { error: "Could not generate cards from this text. Try clearer notes or a different excerpt." },
        { status: 422 }
      );
    }
    return NextResponse.json({
      flashcards,
      provider: out.meta.provider,
      fallbackFrom: out.meta.fallbackFrom,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
