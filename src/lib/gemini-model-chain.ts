/**
 * Shared ordered Gemini model IDs for REST (ai-router) and SDK (gemini.ts).
 * First model that accepts the key + quota wins.
 */
export function geminiModelChain(): string[] {
  const env = process.env.GEMINI_MODEL?.trim();
  const fallbacks = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
  ];
  const raw = env ? [env, ...fallbacks.filter((m) => m !== env)] : fallbacks;
  return [...new Set(raw)];
}
