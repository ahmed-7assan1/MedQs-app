import { NextRequest, NextResponse } from "next/server";
import { auth, type AuthSession } from "@/lib/auth";
import { getServerToken } from "@/lib/supabase/auth-helpers";
import { getSessionScope, isAdminRole, isSuperAdmin, type SessionScope } from "@/lib/tenant";

export type AuthPayload = {
  userId: string;
  session: AuthSession | null;
  token: Record<string, any> | null;
  scope: SessionScope | null;
};

export type AuthHandler<T = any> = (props: AuthPayload & {
  req: NextRequest;
  params: any;
}) => Promise<NextResponse<T>>;

export type AuthOptions = {
  requireRole?: string[];
  requireScope?: boolean;
  allowMobile?: boolean;
  allowWeb?: boolean;
};

const DEFAULT_OPTIONS: AuthOptions = {
  allowMobile: true,
  allowWeb: true,
};

function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

function isBearerRequest(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  return !!authHeader?.startsWith("Bearer ");
}

async function resolveAuth(req: NextRequest): Promise<AuthPayload | null> {
  if (isBearerRequest(req)) {
    const token = await getServerToken(req);
    if (!token) return null;
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return null;
    return { userId, session: null, token, scope: null };
  }

  const session = await auth();
  if (!session?.user?.id) return null;
  const scope = await getSessionScope(session);
  return { userId: session.user.id, session, token: null, scope };
}

export function withAuth(handler: AuthHandler, options?: AuthOptions) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async (req: NextRequest, params: any) => {
    const authPayload = await resolveAuth(req);
    if (!authPayload) return unauthorized();

    if (opts.requireRole && authPayload.scope) {
      const role = authPayload.scope.role;
      if (!role || !opts.requireRole.includes(role)) {
        return forbidden(`Requires one of: ${opts.requireRole.join(", ")}`);
      }
    }

    if (opts.requireRole && authPayload.token) {
      const role = authPayload.token.role as string | undefined;
      if (!role || !opts.requireRole.includes(role)) {
        return forbidden(`Requires one of: ${opts.requireRole.join(", ")}`);
      }
    }

    return handler({ req, params, ...authPayload });
  };
}

export function withAdmin(handler: AuthHandler) {
  return withAuth(handler, { requireRole: ["ADMIN", "SUPER_ADMIN", "LEADER"] });
}

export function withSuperAdmin(handler: AuthHandler) {
  return withAuth(handler, { requireRole: ["SUPER_ADMIN"] });
}

export function withTeacher(handler: AuthHandler) {
  return withAuth(handler, { requireRole: ["TEACHER", "ADMIN", "SUPER_ADMIN", "LEADER"] });
}

export function withContentManager(handler: AuthHandler) {
  return withAuth(handler, { requireRole: ["TEACHER", "ADMIN", "SUPER_ADMIN", "LEADER"] });
}

export type OptionalAuthHandler<T = any> = (props: {
  userId: string | null;
  session: AuthSession | null;
  token: Record<string, any> | null;
  scope: SessionScope | null;
  req: NextRequest;
  params: any;
}) => Promise<NextResponse<T>>;

export function withOptionalAuth(handler: OptionalAuthHandler) {
  return async (req: NextRequest, params: any) => {
    const authPayload = await resolveAuth(req);
    if (authPayload) {
      return handler({ req, params, ...authPayload });
    }
    return handler({ req, params, userId: null, session: null, token: null, scope: null });
  };
}
