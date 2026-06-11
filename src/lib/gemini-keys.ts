const RATE_LIMIT_COOLDOWN_MS = 65_000;
const DAILY_QUOTA_COOLDOWN_MS = 86_400_000; // 24 hours
const STORAGE_KEY = "medqs-gemini-cooldown-v1";

const geminiQuotaExhaustedAt = new Map<string, { at: number; reason: "rate" | "daily" }>();

// Restore from localStorage on module load
try {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored) {
    const parsed = JSON.parse(stored) as [string, { at: number; reason: "rate" | "daily" }][];
    for (const [key, val] of parsed) {
      // Skip entries past their cooldown
      const cooldown = val.reason === "daily" ? DAILY_QUOTA_COOLDOWN_MS : RATE_LIMIT_COOLDOWN_MS;
      if (Date.now() - val.at < cooldown) {
        geminiQuotaExhaustedAt.set(key, val);
      }
    }
  }
} catch {}

function persistCooldown(): void {
  try {
    const entries = Array.from(geminiQuotaExhaustedAt.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function markKeyExhausted(key: string, reason: "rate" | "daily" = "rate"): void {
  geminiQuotaExhaustedAt.set(key, { at: Date.now(), reason });
  persistCooldown();
}

function isKeyFresh(key: string): boolean {
  const entry = geminiQuotaExhaustedAt.get(key);
  if (!entry) return true;
  const cooldown = entry.reason === "daily" ? DAILY_QUOTA_COOLDOWN_MS : RATE_LIMIT_COOLDOWN_MS;
  if (Date.now() - entry.at > cooldown) {
    geminiQuotaExhaustedAt.delete(key);
    persistCooldown();
    return true;
  }
  return false;
}

export async function getSiteConfigOverrides() {
  try {
    const { getSiteConfig } = await import("@/lib/get-site-config");
    return await getSiteConfig();
  } catch (e) {
    console.error("Failed to load site config overrides:", e);
    return null;
  }
}

export async function getGeminiApiKeys(personalKey?: string, strictPersonal = false): Promise<string[]> {
  const envKeys: string[] = [];
  if (!strictPersonal) {
    const config = await getSiteConfigOverrides();
    if (config?.geminiKeyOverride?.trim()) {
      envKeys.push(config.geminiKeyOverride.trim());
    }
    const base = process.env.GEMINI_API_KEY?.trim();
    if (base) envKeys.push(base);
    for (let i = 2; i <= 20; i++) {
      const k = process.env[`GEMINI_API_KEY_${i}`]?.trim();
      if (k) envKeys.push(k);
    }
  }
  const allKeys: string[] = [];
  if (personalKey?.trim()) allKeys.push(personalKey.trim());
  allKeys.push(...envKeys);
  if (allKeys.length === 0) return [];
  const fresh = allKeys.filter((k) => isKeyFresh(k));
  return fresh.length > 0 ? fresh : allKeys;
}

export async function callGeminiWithRetry<T>(
  callFn: (key: string) => Promise<T>,
  personalKey?: string,
): Promise<T> {
  const keys = personalKey ? [personalKey] : await getGeminiApiKeys();
  if (keys.length === 0) throw new Error("No Gemini API keys available");

  let lastError: any;
  for (const key of keys) {
    try {
      return await callFn(key);
    } catch (err: any) {
      lastError = err;
      const msg =
        err.message?.toLowerCase() ||
        err.status?.toString() ||
        err.errorDetails?.[0]?.reason ||
        "";
      if (
        msg.includes("429") ||
        msg.includes("quota") ||
        msg.includes("exhausted") ||
        msg.includes("rate_limit") ||
        msg.includes("resource_exhausted")
      ) {
        markKeyExhausted(key);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
