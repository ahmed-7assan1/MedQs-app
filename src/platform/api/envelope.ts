import { NextResponse } from "next/server";

export type ApiActor = {
  id: string;
  role: string;
};

export type ApiEnvelope<T> = {
  requestId: string;
  tenantKey: string | null;
  actor: ApiActor | null;
  result: T | null;
  errors: string[];
};

function getRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function ok<T>(args: {
  result: T;
  tenantKey?: string | null;
  actor?: ApiActor | null;
  status?: number;
}) {
  const body: ApiEnvelope<T> = {
    requestId: getRequestId(),
    tenantKey: args.tenantKey ?? null,
    actor: args.actor ?? null,
    result: args.result,
    errors: [],
  };
  return NextResponse.json(body, { status: args.status ?? 200 });
}

export function fail(args: {
  error: string;
  tenantKey?: string | null;
  actor?: ApiActor | null;
  status?: number;
}) {
  const body: ApiEnvelope<null> = {
    requestId: getRequestId(),
    tenantKey: args.tenantKey ?? null,
    actor: args.actor ?? null,
    result: null,
    errors: [args.error],
  };
  return NextResponse.json(body, { status: args.status ?? 400 });
}
