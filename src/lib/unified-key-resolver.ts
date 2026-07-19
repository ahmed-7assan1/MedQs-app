import { decryptKey } from "@/lib/encryption";
import { getKeyField } from "@/lib/providers";

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

export type KeySource = "user" | "admin" | "site" | "env";

export interface UnifiedResolvedKey {
  key: string;
  source: KeySource;
}

export function unifiedResolveKey(
  user: { [key: string]: any } | null,
  provider: string,
  options?: { preferAdmin?: boolean; strictPersonal?: boolean }
): UnifiedResolvedKey | null {
  const { preferAdmin = false, strictPersonal = false } = options ?? {};
  if (!user) return null;

  const keyField = getKeyField(provider);
  const userKey = keyField ? (user[keyField] as string | undefined | null) : null;

  if (preferAdmin) {
    // Admin → site → env → user
    const adminKey = tryAdminKey(user, provider);
    if (adminKey) return adminKey;
    const siteKey = trySiteKey(user, provider);
    if (siteKey) return siteKey;
    const envKey = tryEnvKey(provider);
    if (envKey) return envKey;
    if (userKey) return tryDecrypt(userKey, "user");
    return null;
  }

  if (strictPersonal) {
    if (!userKey) return null;
    return tryDecrypt(userKey, "user");
  }

  // Default (BYOK mode): user → admin → site → env
  if (userKey) {
    const resolved = tryDecrypt(userKey, "user");
    if (resolved) return resolved;
  }
  const adminKey = tryAdminKey(user, provider);
  if (adminKey) return adminKey;
  const siteKey = trySiteKey(user, provider);
  if (siteKey) return siteKey;
  return tryEnvKey(provider);
}

function tryDecrypt(raw: string, source: KeySource): UnifiedResolvedKey | null {
  if (looksEncrypted(raw)) {
    try {
      return { key: decryptKey(raw), source };
    } catch {
      return null;
    }
  }
  return { key: raw, source };
}

function tryAdminKey(user: any, provider: string): UnifiedResolvedKey | null {
  if (!user.adminAiKeys) return null;
  const adminField = `encrypted${provider.charAt(0).toUpperCase() + provider.slice(1)}Key`;
  const raw = user.adminAiKeys[adminField] as string | undefined | null;
  if (!raw) return null;
  return tryDecrypt(raw, "admin");
}

function trySiteKey(user: any, provider: string): UnifiedResolvedKey | null {
  if (!user.siteConfig) return null;
  const raw = user.siteConfig[`${provider}Key`] as string | undefined | null;
  if (!raw) return null;
  return { key: raw, source: "site" };
}

function tryEnvKey(provider: string): UnifiedResolvedKey | null {
  const envVarName = `${provider.toUpperCase()}_API_KEY`;
  const raw = process.env[envVarName]?.trim();
  if (raw) return { key: raw, source: "env" };

  // Special case: GEMINI_API_KEY (not GEMINI_API_KEY)
  if (provider === "gemini") {
    const geminiRaw = process.env.GEMINI_API_KEY?.trim();
    if (geminiRaw) return { key: geminiRaw, source: "env" };
  }

  return null;
}

export function getNoKeyErrorMessage(provider: string): string {
  const name = provider.charAt(0).toUpperCase() + provider.slice(1);
  return `No API key found for ${name}. Add one in Settings → AI`;
}
