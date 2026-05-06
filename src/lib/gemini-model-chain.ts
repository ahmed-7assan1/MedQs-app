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
   * Comprehensive fallback chain supporting the latest Google models.
   * Order: Try high-performance 2.0/2.5 Flash models first, then stable 1.5 Flash, then Pro models.
   */
  const fallbacks = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-pro-exp",
    "gemini-1.5-pro",
  ];
  
  // Also add future-proofing for "2.5" if it becomes available in v1beta
  const futureModels = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
  ];

  const raw = env ? [env, ...futureModels, ...fallbacks.filter((m) => m !== env)] : [...futureModels, ...fallbacks];
  return [...new Set(raw)];
}
