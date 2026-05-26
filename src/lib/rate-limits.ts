export interface ProviderLimit {
  maxRPM: number;
  maxDaily: number;
  cooldownMs: number;
}

export interface ProviderUsage {
  used: number;
  limit: number;
  percentage: number;
  ok: boolean;
  resetTime: number;
}

const STORAGE_KEY = "medqs-provider-usage-v1";

export const PROVIDER_RATE_LIMITS: Record<string, ProviderLimit> = {
  gemini: { maxRPM: 30, maxDaily: 1000, cooldownMs: 65_000 },
  groq: { maxRPM: 30, maxDaily: 14400, cooldownMs: 60_000 },
  siliconflow: { maxRPM: 1000, maxDaily: 40000, cooldownMs: 5_000 },
  cloudflare: { maxRPM: 300, maxDaily: 5000, cooldownMs: 10_000 },
  huggingface: { maxRPM: 5, maxDaily: 7200, cooldownMs: 60_000 },
  together: { maxRPM: 60, maxDaily: 10000, cooldownMs: 15_000 },
  openrouter: { maxRPM: 20, maxDaily: 50, cooldownMs: 30_000 },
  ovhcloud: { maxRPM: 60, maxDaily: 5000, cooldownMs: 15_000 },
  github: { maxRPM: 10, maxDaily: 150, cooldownMs: 60_000 },
  cerebras: { maxRPM: 30, maxDaily: 3000, cooldownMs: 30_000 },
  mistral: { maxRPM: 1, maxDaily: 500, cooldownMs: 60_000 },
};

const DAY_MS = 86_400_000;

interface UsageEntry {
  dailyCount: number;
  dailyReset: number;
}

const requestLog = new Map<string, UsageEntry>();

function persist(): void {
  try {
    const obj: Record<string, UsageEntry> = {};
    for (const [k, v] of requestLog) obj[k] = v;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {}
}

function load(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, UsageEntry>;
    const now = Date.now();
    for (const [k, v] of Object.entries(obj)) {
      if (now - v.dailyReset > DAY_MS) continue; // expired
      requestLog.set(k, { dailyCount: v.dailyCount, dailyReset: v.dailyReset });
    }
  } catch {}
}

load();

function getEntry(provider: string): UsageEntry {
  const now = Date.now();
  let entry = requestLog.get(provider);
  if (!entry || now - entry.dailyReset > DAY_MS) {
    entry = { dailyCount: 0, dailyReset: now };
    requestLog.set(provider, entry);
  }
  return entry;
}

export function checkProviderRate(provider: string): {
  ok: boolean;
  rpmUsed: number;
  dailyUsed: number;
  dailyLimit: number;
} {
  const limits = PROVIDER_RATE_LIMITS[provider];
  if (!limits) return { ok: true, rpmUsed: 0, dailyUsed: 0, dailyLimit: 0 };
  const entry = getEntry(provider);
  return {
    ok: entry.dailyCount < limits.maxDaily,
    rpmUsed: 0,
    dailyUsed: entry.dailyCount,
    dailyLimit: limits.maxDaily,
  };
}

export function recordProviderRequest(provider: string): void {
  const entry = getEntry(provider);
  entry.dailyCount++;
  persist();
}

export function getProviderUsage(provider: string): ProviderUsage {
  const limits = PROVIDER_RATE_LIMITS[provider];
  if (!limits) return { used: 0, limit: 0, percentage: 0, ok: true, resetTime: 0 };
  const entry = getEntry(provider);
  const pct = limits.maxDaily > 0 ? Math.min((entry.dailyCount / limits.maxDaily) * 100, 100) : 0;
  return {
    used: entry.dailyCount,
    limit: limits.maxDaily,
    percentage: Math.round(pct),
    ok: entry.dailyCount < limits.maxDaily,
    resetTime: entry.dailyReset + DAY_MS,
  };
}

export function getAllProviderUsage(): Record<string, ProviderUsage> {
  const result: Record<string, ProviderUsage> = {};
  for (const p of Object.keys(PROVIDER_RATE_LIMITS)) {
    result[p] = getProviderUsage(p);
  }
  return result;
}

export function resetProviderUsage(provider?: string): void {
  if (provider) {
    requestLog.delete(provider);
  } else {
    requestLog.clear();
  }
  persist();
}
