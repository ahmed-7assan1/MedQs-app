import { auth } from "@/lib/auth";
import { requireTenantSession } from "@/platform/api/guards";
import { ok } from "@/platform/api/envelope";

export async function GET() {
  const session = await auth();
  const guarded = await requireTenantSession(session);
  if (!guarded.ok) return guarded.response;

  return ok({
    tenantKey: guarded.tenant.tenantKey,
    actor: { id: guarded.tenant.actorUserId, role: guarded.tenant.role },
    result: {
      module: "social",
      routes: ["/api/v2/social/communities", "/api/v2/social/groups", "/api/v2/social/messages"],
      status: "contract-ready",
    },
  });
}
