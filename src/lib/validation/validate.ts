import { z, ZodError } from "zod";
import { badRequest, fromZodError } from "@/lib/api-error";
import type { NextResponse } from "next/server";

export type ValidatedResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidatedResult<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, response: fromZodError(parsed.error) };
  }
  return { success: true, data: parsed.data };
}

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export async function validateBody<T>(
  schema: z.ZodSchema<T>,
  req: Request
): Promise<ValidatedResult<T>> {
  try {
    const body = await req.json();
    return validate(schema, body);
  } catch {
    return { success: false, response: badRequest("Invalid JSON body") };
  }
}
