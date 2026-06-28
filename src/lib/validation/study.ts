import { z } from "zod";
import { uuidField } from "./schemas";

export const studySessionStatus = z.enum(["WAITING", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]);

export const createStudySessionSchema = z.object({
  roomId: uuidField,
  targetDuration: z.number().int().min(1).max(180).default(25),
  breakDuration: z.number().int().min(1).max(30).default(5),
  lectureId: uuidField.optional(),
  lectureTitle: z.string().max(200).optional(),
});

export const updateStudySessionSchema = z.object({
  status: studySessionStatus.optional(),
  targetDuration: z.number().int().min(1).max(180).optional(),
  breakDuration: z.number().int().min(1).max(30).optional(),
});

export type CreateStudySessionInput = z.infer<typeof createStudySessionSchema>;
export type UpdateStudySessionInput = z.infer<typeof updateStudySessionSchema>;
