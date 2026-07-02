export type ProviderId =
  | "gemini" | "openai" | "anthropic" | "deepseek" | "groq"
  | "openrouter" | "xai" | "mistral" | "together" | "huggingface"
  | "cloudflare" | "cerebras" | "github" | "proxy";

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  baseURL: string;
  models: string[];
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsEmbeddings: boolean;
  defaultModel: string;
  keyField: string;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    models: ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: false,
    supportsEmbeddings: true,
    defaultModel: "gemini-2.5-flash-lite",
    keyField: "personalGeminiKey",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsEmbeddings: true,
    defaultModel: "gpt-4o-mini",
    keyField: "personalOpenAIKey",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    baseURL: "https://api.anthropic.com/v1",
    models: ["claude-3-5-sonnet-20240620", "claude-3-haiku-20240307"],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsEmbeddings: false,
    defaultModel: "claude-3-5-sonnet-20240620",
    keyField: "personalAnthropicKey",
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    baseURL: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-reasoner"],
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
    supportsEmbeddings: true,
    defaultModel: "deepseek-chat",
    keyField: "personalDeepseekKey",
  },
  groq: {
    id: "groq",
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "meta-llama/llama-4-scout-17b-16e-instruct"],
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
    supportsEmbeddings: false,
    defaultModel: "llama-3.3-70b-versatile",
    keyField: "personalGroqKey",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    models: ["openrouter/free", "deepseek/deepseek-v4-flash:free", "google/gemma-4-31b-it:free"],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: false,
    supportsEmbeddings: false,
    defaultModel: "openrouter/free",
    keyField: "personalOpenrouterKey",
  },
  xai: {
    id: "xai",
    name: "xAI",
    baseURL: "https://api.x.ai/v1",
    models: ["grok-2", "grok-beta"],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsEmbeddings: false,
    defaultModel: "grok-2",
    keyField: "personalXaiKey",
  },
  mistral: {
    id: "mistral",
    name: "Mistral AI",
    baseURL: "https://api.mistral.ai/v1",
    models: ["mistral-large-latest", "mistral-small-latest", "open-mistral-nemo", "codestral-latest"],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: false,
    supportsEmbeddings: true,
    defaultModel: "mistral-large-latest",
    keyField: "personalMistralKey",
  },
  together: {
    id: "together",
    name: "Together AI",
    baseURL: "https://api.together.xyz/v1",
    models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "deepseek-ai/DeepSeek-V3"],
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
    supportsEmbeddings: false,
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    keyField: "personalTogetherKey",
  },
  huggingface: {
    id: "huggingface",
    name: "Hugging Face",
    baseURL: "https://api-inference.huggingface.co/v1",
    models: ["meta-llama/Llama-3.3-70B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3"],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: false,
    supportsEmbeddings: true,
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    keyField: "personalHuggingfaceKey",
  },
  cloudflare: {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    baseURL: "https://api.cloudflare.com/client/v4/accounts",
    models: ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct"],
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
    supportsEmbeddings: false,
    defaultModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    keyField: "personalCloudflareKey",
  },
  cerebras: {
    id: "cerebras",
    name: "Cerebras",
    baseURL: "https://api.cerebras.ai/v1",
    models: ["llama-3.3-70b", "qwen-3-32b"],
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
    supportsEmbeddings: false,
    defaultModel: "llama-3.3-70b",
    keyField: "personalCerebrasKey",
  },
  github: {
    id: "github",
    name: "GitHub Models",
    baseURL: "https://models.github.ai/inference",
    models: ["gpt-4o", "Meta-Llama-3.3-70B-Instruct", "DeepSeek-R1"],
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: false,
    supportsEmbeddings: false,
    defaultModel: "gpt-4o",
    keyField: "personalGithubKey",
  },
  proxy: {
    id: "proxy",
    name: "Proxy",
    baseURL: "",
    models: [],
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
    supportsEmbeddings: false,
    defaultModel: "",
    keyField: "personalProxyKey",
  },
};

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDERS[id as ProviderId];
}

export function getKeyField(provider: string): string | undefined {
  return PROVIDERS[provider as ProviderId]?.keyField;
}

export function getAllProviderIds(): ProviderId[] {
  return Object.keys(PROVIDERS) as ProviderId[];
}
