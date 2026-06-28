import { z } from "zod";
import { emailField } from "./schemas";

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(80).trim().optional(),
  email: emailField.optional(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"]).optional(),
  universityId: z.string().uuid().nullable().optional(),
  facultyId: z.string().uuid().nullable().optional(),
  semesterId: z.string().uuid().nullable().optional(),
  isBanned: z.boolean().optional(),
  banReason: z.string().max(500).nullable().optional(),
  isLeader: z.boolean().optional(),
});

export const adminCreateUserSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: emailField,
  password: z.string().min(8),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).default("STUDENT"),
  universityId: z.string().uuid(),
  facultyId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
