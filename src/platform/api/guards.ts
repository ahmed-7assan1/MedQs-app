import type { AuthSession as Session } from "@/lib/auth";
import { fail } from "@/platform/api/envelope";
import { resolveTenantContext } from "@/platform/tenant/tenant-resolver";

export async function requireTenantSession(session: Session | null) {
  const tenant = await resolveTenantContext(session);
  if (!tenant) return { ok: false as const, response: fail({ error: "Unauthorized", status: 401 }) };
  return { ok: true as const, tenant };
}

export function requireTenantKey(tenantKey: string | null) {
  if (!tenantKey) return { ok: false as const, response: fail({ error: "Tenant not assigned", status: 403 }) };
  return { ok: true as const };
}
