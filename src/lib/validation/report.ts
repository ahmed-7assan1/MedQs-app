import { z } from "zod";

export const reportType = z.enum(["CONTENT", "USER", "SPAM", "OTHER"]);

export const reportSubtype = z.enum(["QUESTION", "POST", "COMMENT", "PROFILE", "OTHER"]);

export const reportTargetType = z.enum(["POST", "COMMENT", "USER"]);

export const reportStatus = z.enum(["PENDING", "DISMISSED", "RESOLVED"]);

export const reportAction = z.enum(["DISMISSED", "RESOLVED", "WARNED", "REMOVED"]);

export const createReportSchema = z.object({
  type: reportType,
  subtype: reportSubtype.optional(),
  targetType: reportTargetType,
  targetId: z.string().min(1),
  reason: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
});

export const resolveReportSchema = z.object({
  action: reportAction,
  note: z.string().max(500).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
