import { createDomainEvent } from "@/platform/events/domain-events";
import type { AdminAiGenerationRequest } from "@/modules/ai/contracts";

export type AdminAiStage = "INGEST" | "CHUNK" | "GENERATE" | "REVIEW" | "PUBLISH";

export type AdminAiJob = {
  jobId: string;
  tenantKey: string;
  lectureId: string;
  stages: AdminAiStage[];
  currentStage: AdminAiStage;
  createdAt: string;
};

export function createAdminAiJob(request: AdminAiGenerationRequest): AdminAiJob {
  return {
    jobId: `adm_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    tenantKey: request.tenantKey,
    lectureId: request.lectureId,
    stages: ["INGEST", "CHUNK", "GENERATE", "REVIEW", "PUBLISH"],
    currentStage: "INGEST",
    createdAt: new Date().toISOString(),
  };
}

export function completeAdminAiJob(job: AdminAiJob, artifactCount: number) {
  return createDomainEvent({
    name: "ai.admin.job.completed",
    tenantKey: job.tenantKey,
    payload: {
      jobId: job.jobId,
      lectureId: job.lectureId,
      artifactCount,
      completedAt: new Date().toISOString(),
    },
  });
}
