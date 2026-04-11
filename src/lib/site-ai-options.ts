/**
 * Map SiteConfig.aiPreferredProvider to options for AI calls (essay grading, plans, OCR assist, etc.).
 * "auto" or unknown → let the router pick defaults.
 */
export type SiteAiProvider = "gemini" | "openai" | "anthropic" | "deepseek";

export function aiOptionsFromSiteProvider(
  raw: string | null | undefined
): { preferredProvider: SiteAiProvider } | undefined {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s || s === "auto") return undefined;
  if (s === "gemini" || s === "openai" || s === "anthropic" || s === "deepseek") {
    return { preferredProvider: s };
  }
  return undefined;
}
