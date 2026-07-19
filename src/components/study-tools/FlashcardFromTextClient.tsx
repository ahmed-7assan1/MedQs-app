"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Copy, Check, ArrowLeft } from "lucide-react";
import { FlashcardDeck } from "@/components/content/FlashcardDeck";
import { MedqsCard } from "@/components/ui/MedqsCard";
import { useAIKey } from "@/hooks/useAIKey";
import toast from "react-hot-toast";

type Card = { front: string; back: string };

export function FlashcardFromTextClient({ signedIn }: { signedIn: boolean }) {
  const [text, setText] = useState("");
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [copied, setCopied] = useState<"tsv" | "md" | null>(null);
  const { getKey } = useAIKey();

  async function generate() {
    if (!signedIn) {
      toast.error("Sign in to generate flashcards");
      return;
    }
    const trimmed = text.trim();
    if (trimmed.length < 80) {
      toast.error("Paste at least 80 characters");
      return;
    }
    if (trimmed.length > 12_000) {
      toast.error("Text must be at most 12,000 characters");
      return;
    }
    setLoading(true);
    setCards(null);

    const geminiKey = getKey("gemini");

    // BYOK path — client calls Gemini directly, zero Vercel server cost
    if (geminiKey) {
      try {
        const focusLine = (focus || "").trim().slice(0, 500);
        const prompt = `You help medical students turn their own study notes into flashcards.

RULES:
- Use ONLY information that appears in the STUDY MATERIAL below. Do not add facts, doses, or protocols that are not supported by that text.
- If the text is short, produce fewer cards (minimum 4 if there is enough content, otherwise as many as justified).
- Maximum 20 cards.
- Front: short question, prompt, or term (one line).
- Back: concise answer (1–3 sentences).
- Match the language of the study material (e.g. Arabic notes → Arabic cards).

STUDY MATERIAL:
${trimmed.slice(0, 12_000)}

${focusLine ? `Student asked to emphasize: ${focusLine}\n` : ""}

Return ONLY valid JSON:
{"flashcards":[{"front":"...","back":"..."}]}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Gemini error ${res.status}`);
        }
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("Empty response from AI");
        const clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
        const parsed = JSON.parse(clean);
        const rawCards = parsed.flashcards || [];
        if (!Array.isArray(rawCards) || rawCards.length === 0) throw new Error("No cards in response");
        const validated = rawCards
          .filter((f: any) => f && String(f.front).trim() && String(f.back).trim())
          .map((f: any) => ({
            front: String(f.front).trim().slice(0, 500),
            back: String(f.back).trim().slice(0, 1200),
          }))
          .slice(0, 20);
        setCards(validated);
        toast.success(`${validated.length} cards ready`);
        setLoading(false);
        return;
      } catch (e: any) {
        const msg = e.message || "AI generation failed";
        toast.error(`Gemini failed: ${msg}. Falling back to server...`);
        // fall through to server fallback
      }
    }

    // Server fallback path (no BYOK, or BYOK failed)
    try {
      const res = await fetch("/api/v1/ai/flashcards-from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, focus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Something went wrong");
        return;
      }
      const raw = data.flashcards as Card[] | undefined;
      if (!Array.isArray(raw) || raw.length === 0) {
        toast.error("No cards returned");
        return;
      }
      setCards(raw);
      toast.success(`${raw.length} cards ready`);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  function copyTsv() {
    if (!cards?.length) return;
    const tsv = cards.map((c) => `${c.front.replace(/\t/g, " ")}\t${c.back.replace(/\t/g, " ")}`).join("\n");
    void navigator.clipboard.writeText(tsv).then(() => {
      setCopied("tsv");
      toast.success("Copied tab-separated (Anki-friendly)");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function copyMarkdown() {
    if (!cards?.length) return;
    const md = cards.map((c, i) => `### ${i + 1}. ${c.front}\n\n${c.back}\n`).join("\n");
    void navigator.clipboard.writeText(md).then(() => {
      setCopied("md");
      toast.success("Copied as Markdown");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const deckData =
    cards?.map((c, i) => ({
      id: `gen-${i}`,
      front: c.front,
      back: c.back,
    })) ?? [];

  return (
    <div className="space-y-8">
      <Link
        href="/study-tools"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to study tools
      </Link>

      {!signedIn ? (
        <MedqsCard className="border-amber-500/20 bg-amber-500/[0.06]" padding="md">
          <p className="text-sm text-foreground">
            <Link href="/login" className="font-semibold text-primary underline-offset-2 hover:underline">
              Sign in
            </Link>{" "}
            to turn your notes into flashcards. Cards are generated for you to review and copy—they are not saved to your
            official lecture decks.
          </p>
        </MedqsCard>
      ) : null}

      <MedqsCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Paste your notes</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Minimum 80 characters. AI builds 4–20 cards from <strong className="text-foreground">your text only</strong>—always
          verify facts against your course materials.
        </p>
        <label className="sr-only" htmlFor="notes-paste">
          Study notes
        </label>
        <textarea
          id="notes-paste"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!signedIn || loading}
          rows={10}
          placeholder="Paste bullet notes, a lecture summary, or textbook excerpt…"
          className="mb-4 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="focus-hint">
          Optional focus (e.g. “exam drugs only”, “pathophysiology”)
        </label>
        <input
          id="focus-hint"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          disabled={!signedIn || loading}
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          placeholder="Optional"
        />
        <button
          type="button"
          onClick={() => void generate()}
          disabled={!signedIn || loading || text.trim().length < 80}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate flashcards
        </button>
      </MedqsCard>

      {cards && cards.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyTsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {copied === "tsv" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              Copy tab-separated
            </button>
            <button
              type="button"
              onClick={copyMarkdown}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {copied === "md" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              Copy Markdown
            </button>
          </div>
          <FlashcardDeck flashcards={deckData} />
        </>
      ) : null}
    </div>
  );
}
