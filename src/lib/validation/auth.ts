import { z } from "zod";
import {
  emailField,
  passwordField,
  usernameField,
  telegramPhoneField,
  verificationCodeField,
  nicknameField,
  handleField,
  emptyStringToUndefined,
  optionalUrl,
} from "./schemas";

export const loginSchema = z.object({
  email: emailField.optional(),
  studentId: z.string().optional(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: emailField,
  password: passwordField,
  nickname: usernameField,
  studentId: z.string().min(4, "Registration ID is required").trim(),
  universityId: z.string().min(1, "University is required"),
  facultyId: z.string().min(1, "Faculty is required"),
  semesterId: z.string().optional(),
  telegramPhone: telegramPhoneField,
  verificationCode: verificationCodeField,
  captchaToken: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordField,
});

export const profileUpdateSchema = z.object({
  name: emptyStringToUndefined(
    z.string().min(2, "Name must be at least 2 characters").max(80).trim()
  ).optional(),
  nickname: emptyStringToUndefined(nicknameField).optional(),
  handle: emptyStringToUndefined(handleField).optional(),
  bio: z.string().max(500).trim().nullable().optional(),
  phone: z.string().max(20).trim().nullable().optional(),
  phoneVisible: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  hideRank: z.boolean().optional(),
  instagramUrl: optionalUrl.optional(),
  facebookUrl: optionalUrl.optional(),
  universityId: z.string().nullable().optional(),
  facultyId: z.string().nullable().optional(),
  semesterId: z.string().nullable().optional(),
  studentId: emptyStringToUndefined(
    z.string().min(4).max(24)
  ).optional(),
  coverImage: z.string().nullable().optional(),
  telegramPhone: emptyStringToUndefined(telegramPhoneField).optional(),
  verificationCode: emptyStringToUndefined(verificationCodeField).optional(),
  useCustomKey: z.boolean().optional(),
  personalGeminiKey: z.string().nullable().optional(),
  personalOpenAIKey: z.string().nullable().optional(),
  personalGroqKey: z.string().nullable().optional(),
  personalOpenRouterKey: z.string().nullable().optional(),
  theme: z.enum(["SYSTEM", "LIGHT", "DARK"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
