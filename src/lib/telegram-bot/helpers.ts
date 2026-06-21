import { prisma } from "@/lib/prisma";
import { MEDICAL_TUTOR_SYSTEM_PREFIX } from "@/lib/medical-ai-prompts";

export type ProviderKey =
  | "gemini" | "groq" | "siliconflow" | "cloudflare" | "huggingface"
  | "together" | "openrouter" | "ovhcloud" | "github" | "cerebras"
  | "mistral" | "xai" | "anthropic" | "openai";

export interface LinkedUser {
  id: string;
  name: string;
  email: string;
  password: string | null;
  telegramId: string | null;
  telegramVerified: boolean;
  university: { name: string } | null;
  semester: { name: string } | null;
  semesterId: string | null;
  universityId: string | null;
  points: number;
  personalGeminiKey: string | null;
  personalOpenAIKey: string | null;
  personalGroqKey: string | null;
  personalOpenRouterKey: string | null;
  personalXAIKey: string | null;
  personalAnthropicKey: string | null;
  personalSiliconFlowKey: string | null;
  personalCloudflareKey: string | null;
  personalHuggingfaceKey: string | null;
  personalTogetherKey: string | null;
  personalGithubKey: string | null;
  personalCerebrasKey: string | null;
  personalMistralKey: string | null;
  handle: string | null;
  [key: string]: unknown;
}

const ALL_PROVIDERS: { key: ProviderKey; label: string; field: string; icon: string }[] = [
  { key: "gemini", label: "Google Gemini", field: "personalGeminiKey", icon: "🌐" },
  { key: "groq", label: "Groq", field: "personalGroqKey", icon: "⚡" },
  { key: "openrouter", label: "OpenRouter", field: "personalOpenRouterKey", icon: "⊜" },
  { key: "siliconflow", label: "SiliconFlow", field: "personalSiliconFlowKey", icon: "🌀" },
  { key: "anthropic", label: "Anthropic", field: "personalAnthropicKey", icon: "🤖" },
  { key: "openai", label: "OpenAI", field: "personalOpenAIKey", icon: "🔵" },
  { key: "xai", label: "xAI Grok", field: "personalXAIKey", icon: "🧠" },
  { key: "huggingface", label: "HuggingFace", field: "personalHuggingfaceKey", icon: "🤗" },
  { key: "mistral", label: "Mistral AI", field: "personalMistralKey", icon: "💠" },
  { key: "together", label: "Together AI", field: "personalTogetherKey", icon: "◆" },
  { key: "cloudflare", label: "Cloudflare", field: "personalCloudflareKey", icon: "☁" },
  { key: "cerebras", label: "Cerebras", field: "personalCerebrasKey", icon: "⚙" },
  { key: "github", label: "GitHub Models", field: "personalGithubKey", icon: "🐙" },
  { key: "ovhcloud", label: "OVHcloud", field: "personalCerebrasKey", icon: "☁" },
];

export function getProviderList() {
  return ALL_PROVIDERS;
}

export function getUserApiKeys(user: LinkedUser): Record<ProviderKey, string | null> {
  return {
    gemini: user.personalGeminiKey,
    groq: user.personalGroqKey,
    siliconflow: user.personalSiliconFlowKey,
    cloudflare: user.personalCloudflareKey,
    huggingface: user.personalHuggingfaceKey,
    together: user.personalTogetherKey,
    openrouter: user.personalOpenRouterKey,
    ovhcloud: user.personalCerebrasKey,
    github: user.personalGithubKey,
    cerebras: user.personalCerebrasKey,
    mistral: user.personalMistralKey,
    xai: user.personalXAIKey,
    anthropic: user.personalAnthropicKey,
    openai: user.personalOpenAIKey,
  };
}

export function countUserKeys(user: LinkedUser): number {
  const keys = getUserApiKeys(user);
  return Object.values(keys).filter(Boolean).length;
}

export function getActiveProviderNames(user: LinkedUser): string[] {
  const keys = getUserApiKeys(user);
  return ALL_PROVIDERS.filter(p => keys[p.key]).map(p => p.label);
}

export async function getLinkedUser(telegramId: string): Promise<LinkedUser | null> {
  const user = await (prisma.user as any).findFirst({
    where: { telegramId: telegramId.toString() },
    include: { university: true, semester: true }
  });
  return user as LinkedUser | null;
}

export async function getBotUser(telegramId: string) {
  let user = await (prisma as any).botUser.findUnique({ where: { telegramId: telegramId.toString() } });
  if (!user) {
    user = await (prisma as any).botUser.create({
      data: { telegramId: telegramId.toString(), preferredProvider: "gemini" }
    });
  }
  return user;
}

export async function getGlobalConfig() {
  return await (prisma as any).telegramConfig.findUnique({ where: { id: "global" } });
}

export function getSystemPromptForUser(user: LinkedUser | null): string {
  if (user) {
    return `${MEDICAL_TUTOR_SYSTEM_PREFIX}\n\n[USER: Dr. ${user.name}]`;
  }
  return MEDICAL_TUTOR_SYSTEM_PREFIX;
}

export function validateEmail(email: string): boolean {
  return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(email.trim().toLowerCase());
}
