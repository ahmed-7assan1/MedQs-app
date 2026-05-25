/**
 * Shared ordered Gemini model IDs for REST (ai-router) and SDK (gemini.ts).
 * First model that accepts the key + quota wins.
 *
 * Avoid experimental `-exp` IDs in .env — Google removes them from v1beta without notice (404).
 */
const DEPRECATED_MODEL_MAP: Record<string, string> = {
  "gemini-1.5-flash-exp": "gemini-2.0-flash",
  "gemini-1.5-pro-exp": "gemini-2.0-flash",
  /** Bare 1.5 IDs often 404 on current v1beta for AI Studio keys — use 2.0 flash */
  "gemini-1.5-pro": "gemini-2.0-flash",
  "gemini-1.5-pro-latest": "gemini-2.0-flash",
  "gemini-pro": "gemini-2.0-flash",
  "gemini-2.0-flash-exp": "gemini-2.0-flash",
  "gemini-exp-1206": "gemini-2.0-flash",
};

function normalizeEnvModel(id: string): string {
  const t = id.trim();
  return DEPRECATED_MODEL_MAP[t] ?? t;
}

export function geminiModelChain(): string[] {
  const envRaw = process.env.GEMINI_MODEL?.trim();
  const env = envRaw ? normalizeEnvModel(envRaw) : "";
  /**
   * Stable fallback chain — only models confirmed to work in v1beta.
   * gemini-2.5-* models are NOT yet available in v1beta (cause 404 → wasted round-trips).
   * Order: fastest/cheapest first, then heavier models.
   */
  const fallbacks = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];

  const raw = env ? [env, ...fallbacks.filter((m) => m !== env)] : fallbacks;
  return [...new Set(raw)];
}
