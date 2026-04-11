import type { Session } from "next-auth";
import { getSessionScope } from "@/lib/tenant";

export type TenantContext = {
  actorUserId: string;
  role: string;
  universityId: string | null;
  semesterId: string | null;
  facultyId: string | null;
  tenantKey: string | null;
};

export async function resolveTenantContext(session: Session | null): Promise<TenantContext | null> {
  const scope = await getSessionScope(session);
  if (!scope) return null;

  return {
    actorUserId: scope.userId,
    role: scope.role ?? "STUDENT",
    universityId: scope.universityId,
    semesterId: scope.semesterId,
    // V1 compatibility: faculty is not modeled yet.
    facultyId: null,
    tenantKey: scope.universityId ?? null,
  };
}

export function assertTenantContext(ctx: TenantContext | null): asserts ctx is TenantContext {
  if (!ctx) throw new Error("Unauthorized: missing tenant context");
}
