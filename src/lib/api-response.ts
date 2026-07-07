import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessBody<T = unknown> {
  data: T;
}

export function apiError(
  status: number,
  error: string,
  message?: string,
  details?: unknown,
  headers?: HeadersInit
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error, message: message || error, ...(details !== undefined ? { details } : {}) },
    { status, headers }
  );
}

export function apiSuccess<T>(
  data: T,
  status = 200,
  headers?: HeadersInit
): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ data }, { status, headers });
}

export function apiUnauthorized(message?: string) {
  return apiError(401, "Unauthorized", message || "Authentication required");
}

export function apiNotFound(message?: string) {
  return apiError(404, "Not Found", message || "Resource not found");
}

export function apiServerError(message?: string, details?: unknown) {
  return apiError(500, "Internal Server Error", message || "An unexpected error occurred", details);
}
