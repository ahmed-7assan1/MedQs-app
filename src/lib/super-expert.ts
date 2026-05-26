export type SuperExpertRole = "generator" | "critic" | "formatter";

export interface SuperExpertStep {
  id: string;
  role: SuperExpertRole;
  label: string;
  icon: string;
  status: "pending" | "active" | "completed" | "failed";
  error?: string;
  content?: string;
  durationMs?: number;
}

export interface SuperExpertProgress {
  phase:
    | "idle"
    | "analyzing"
    | "generating"
    | "critiquing"
    | "formatting"
    | "synthesizing"
    | "done"
    | "error";
  steps: SuperExpertStep[];
  error?: string;
}

export interface ProviderAssignment {
  provider: string;
  role: SuperExpertRole;
  apiKey: string;
  baseURL: string;
  model: string;
  skipAuth: boolean;
  supportsFiles: boolean;
}

const ROLE_META: Record<
  SuperExpertRole,
  { label: string; icon: string; emoji: string }
> = {
  generator: { label: "Generator", icon: "sparkle", emoji: "✍️" },
  critic: { label: "Critic", icon: "magnifying-glass", emoji: "🔍" },
  formatter: { label: "Formatter", icon: "paint-brush", emoji: "🎨" },
};

export function createStep(role: SuperExpertRole, provider: string): SuperExpertStep {
  const m = ROLE_META[role];
  return { id: `${role}-${provider}`, role, label: m.label, icon: m.emoji, status: "pending" };
}

export function getRolePrompt(
  role: SuperExpertRole,
  query: string,
  context?: string,
  draft?: string,
  reviewed?: string
): string {
  switch (role) {
    case "generator":
      return `You are the Generator — your role is to write the first comprehensive draft. Be thorough, accurate, and well-structured.

Original request: ${query}

${context ? `Additional context: ${context}\n\n` : ""}Write a complete, well-organized response. Include all relevant details.`;
    case "critic":
      return `You are the Critic — your role is to review this draft for errors, redundancies, and quality improvements.

Draft to review: ${draft}

Original request: ${query}

Check for: factual errors, logical inconsistencies, redundant content, missing information, clarity improvements. Provide specific, actionable feedback.`;
    case "formatter":
      return `You are the Formatter — format this content based on the original request.

Content: ${reviewed || draft}

Original request: ${query}

Present this content in the most appropriate format: tables for comparisons, lists for steps, markdown for readability, code blocks where needed, etc.`;
  }
}

export function getSynthesisPrompt(
  query: string,
  generatorOutput: string,
  criticOutput?: string,
  formatterOutput?: string
): string {
  return `You are the Orchestrator AI. Synthesize the following outputs into one cohesive, final response for the user.

Original request: ${query}

Generator's Draft: ${generatorOutput}

${criticOutput ? `Critic's Review: ${criticOutput}\n\n` : ""}${formatterOutput ? `Formatter's Output: ${formatterOutput}\n\n` : ""}
Combine these into a single, comprehensive, well-formatted response. Incorporate improvements from the Critic. Use the Formatter's structure if available. Write naturally as if you are the only AI.`;
}

export function getAnalyzerPrompt(
  query: string,
  historyMessages: string,
  fileSummary: string,
  providerCount: number
): string {
  const roles = [];
  if (providerCount >= 1) roles.push("Generator (writes the first comprehensive draft)");
  if (providerCount >= 2) roles.push("Critic (reviews the draft for errors and improvements)");
  if (providerCount >= 3) roles.push("Formatter (formats the final output)");

  return `You are the Orchestrator AI. Analyze the user's query and chat history.

User's query: ${query}

${historyMessages ? `Recent conversation:\n${historyMessages}\n\n` : ""}${fileSummary ? `File attachments: ${fileSummary}\n\n` : ""}Your task: Understand what the user needs and prepare a clear summary for the specialist AIs.

Available specialists: ${roles.join(", ")}

Respond with ONLY a concise task description that captures the user's intent, key requirements, format preferences, and any critical context. Do NOT answer the query — just analyze it.`;
}

export function assignRoles(
  workers: Array<{
    provider: string;
    apiKey: string;
    model: string;
    baseURL: string;
    skipAuth: boolean;
  }>
): ProviderAssignment[] {
  const assignments: ProviderAssignment[] = [];
  const roleOrder: SuperExpertRole[] = ["generator", "critic", "formatter"];
  workers.forEach((w, idx) => {
    assignments.push({
      ...w,
      role: idx < roleOrder.length ? roleOrder[idx] : "generator",
      supportsFiles: w.provider === "gemini",
    });
  });
  return assignments;
}
