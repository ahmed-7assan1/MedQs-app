import { z } from "zod";

export const uuidField = z.string().uuid("Invalid UUID");

export const paginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const cursorPaginationParams = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const emptyStringToUndefined = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), schema);

export const trimString = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() : v), schema);

export const optionalUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return null;
    const t = String(v).trim();
    if (!t) return null;
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    return withProto;
  })
  .pipe(z.union([z.null(), z.string().url("Must be a valid URL")]));

export const imageUrl = z.union([
  z.string().refine(
    (s) =>
      s.startsWith("/") ||
      s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("data:image/"),
    { message: "Invalid image URL" }
  ),
  z.literal(""),
]);

export const usernamePattern = /^[a-zA-Z0-9._-]+$/;

export const usernameField = z
  .string()
  .min(3)
  .max(24)
  .regex(usernamePattern, "May include letters, numbers, dot, underscore, dash");

export const handleField = z
  .string()
  .max(30)
  .regex(usernamePattern, "May include letters, numbers, dot, underscore, dash");

export const nicknameField = z
  .string()
  .max(30)
  .regex(usernamePattern, "May include letters, numbers, dot, underscore, dash");

export const emailField = z.string().email().toLowerCase();

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const telegramPhoneField = z.string().min(10, "Telegram phone is required");

export const verificationCodeField = z.string().length(6, "6-digit code required");

export const sortOrder = z.enum(["asc", "desc"]).default("desc");
