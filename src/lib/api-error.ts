import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorBody = { error: string; details?: unknown };

export function apiError(status: number, message: string, details?: unknown): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

export function badRequest(message: string, details?: unknown): NextResponse<ApiErrorBody> {
  return apiError(400, message, details);
}

export function unauthorized(message = "Unauthorized"): NextResponse<ApiErrorBody> {
  return apiError(401, message);
}

export function forbidden(message = "Forbidden"): NextResponse<ApiErrorBody> {
  return apiError(403, message);
}

export function notFound(message = "Not found"): NextResponse<ApiErrorBody> {
  return apiError(404, message);
}

export function conflict(message: string): NextResponse<ApiErrorBody> {
  return apiError(409, message);
}

export function tooManyRequests(message = "Rate limit exceeded"): NextResponse<ApiErrorBody> {
  return apiError(429, message);
}

export function serverError(message = "Internal server error"): NextResponse<ApiErrorBody> {
  return apiError(500, message);
}

export function fromZodError(error: ZodError): NextResponse<ApiErrorBody> {
  const firstMessage = error.errors[0]?.message ?? "Invalid input";
  return badRequest(firstMessage, error.errors);
}

export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}
