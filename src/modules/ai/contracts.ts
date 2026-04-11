export type AdminAiArtifactKind = "FLASHCARDS" | "MCQ_SET" | "SUMMARY" | "NOTES";

export type AdminAiGenerationRequest = {
  tenantKey: string;
  lectureId: string;
  sourceFileUrl?: string | null;
  sourceText?: string | null;
  artifacts: AdminAiArtifactKind[];
};

export type StudentAiRequest = {
  tenantKey: string;
  studentUserId: string;
  lectureId?: string | null;
  prompt: string;
};

export type AiServiceContract = {
  generateAdminArtifacts: (req: AdminAiGenerationRequest) => Promise<{ jobId: string }>;
  answerStudent: (req: StudentAiRequest) => Promise<{ answer: string; citations: string[] }>;
};
