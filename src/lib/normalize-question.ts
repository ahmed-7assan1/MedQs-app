// Shared normalization utility — works on both client and server

/**
 * Sanitize a question to allow fuzzy matching:
 * - lowercase
 * - remove punctuation (except spaces/digits/Arabic)
 * - collapse whitespace
 * - replace known user personalization tokens with placeholders
 */
export function normalizeQuestion(text: string): string {
  let s = text.trim().toLowerCase();

  // Replace user name patterns with placeholder
  // Matches any Arabic/English name after greeting words
  s = s.replace(/\b(hi|hello|hey|يا|اهلا|مرحبا|هلا)\s+[a-z\u0600-\u06FF]+\b/gi, "$1 {name}");

  // Normalize whitespace
  s = s.replace(/\s+/g, " ").trim();

  // Remove trailing punctuation
  s = s.replace(/[.!?،؟]+$/g, "");

  return s;
}

/**
 * Generate a deterministic hash for a normalized question
 */
export function hashQuestion(normalized: string): string {
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}
