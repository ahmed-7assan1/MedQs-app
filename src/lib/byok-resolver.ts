import { decryptKey } from "@/lib/encryption";
import { getKeyField } from "@/lib/providers";

function looksEncrypted(value: string): boolean {
  return value.startsWith("{") && value.includes('"encrypted"') && value.includes('"iv"') && value.includes('"tag"');
}

export type KeySource = "user" | "admin" | "site";

export interface ResolvedKey {
  key: string;
  source: KeySource;
}

export function getNoKeyErrorMessage(provider: string): string {
  const name = provider.charAt(0).toUpperCase() + provider.slice(1);
  return `No API key found for ${name}. Add one in Settings → AI`;
}

export function resolveBestKey(
  user: any | null,
  provider: string,
  _feature?: string
): ResolvedKey | null {
  if (!user) return null;

  // 1. Try user's personal key
  const keyField = getKeyField(provider);
  if (keyField) {
    const rawKey = user[keyField] as string | undefined | null;
    if (rawKey) {
      if (looksEncrypted(rawKey)) {
        try {
          const decrypted = decryptKey(rawKey);
          return { key: decrypted, source: "user" };
        } catch {
          return null;
        }
      }
      return { key: rawKey, source: "user" };
    }
  }

  // 2. Try admin key (AdminAIKeys relation)
  if (user.adminAiKeys) {
    const adminKeyField = `encrypted${provider.charAt(0).toUpperCase() + provider.slice(1)}Key`;
    const adminRaw = user.adminAiKeys[adminKeyField] as string | undefined | null;
    if (adminRaw) {
      if (looksEncrypted(adminRaw)) {
        try {
          const decrypted = decryptKey(adminRaw);
          return { key: decrypted, source: "admin" };
        } catch {
          return null;
        }
      }
      return { key: adminRaw, source: "admin" };
    }
  }

  // 3. Try site config key override
  if (user.siteConfig?.[`${provider}Key`]) {
    return { key: user.siteConfig[`${provider}Key`], source: "site" };
  }

  return null;
}
