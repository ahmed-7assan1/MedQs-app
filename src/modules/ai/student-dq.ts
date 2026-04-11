import { createDomainEvent } from "@/platform/events/domain-events";

export type StudentContextGraph = {
  tenantKey: string;
  studentUserId: string;
  lectureId?: string | null;
  weakTopics: string[];
  progressPercent: number;
  recentMistakes: Array<{ questionId: string; concept: string }>;
};

export type DQAnswer = {
  answer: string;
  recommendedNextSteps: string[];
  citations: string[];
};

export function buildDqSystemPrompt(ctx: StudentContextGraph): string {
  return [
    "You are D.Q, a medical learning assistant.",
    `Student progress: ${ctx.progressPercent}%`,
    `Weak topics: ${ctx.weakTopics.join(", ") || "none"}`,
    `Recent mistakes: ${ctx.recentMistakes.map((m) => m.concept).join(", ") || "none"}`,
    "Prioritize remediation, spaced repetition, and concise explanations.",
  ].join("\n");
}

export function logDqInteraction(args: {
  tenantKey: string;
  studentUserId: string;
  lectureId?: string | null;
  prompt: string;
}) {
  return createDomainEvent({
    name: "ai.student.interaction.logged",
    tenantKey: args.tenantKey,
    actorUserId: args.studentUserId,
    payload: {
      lectureId: args.lectureId ?? null,
      promptSize: args.prompt.length,
      occurredAt: new Date().toISOString(),
    },
  });
}
