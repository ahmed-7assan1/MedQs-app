import { auth } from "@/lib/auth";
import { requireTenantSession } from "@/platform/api/guards";
import { ok } from "@/platform/api/envelope";
import { FLAG_V2_ORG_CONTENT_ASSESSMENT, isFeatureEnabled } from "@/platform/flags";

export async function GET() {
  const session = await auth();
  const guarded = await requireTenantSession(session);
  if (!guarded.ok) return guarded.response;

  const enabled = await isFeatureEnabled({
    key: FLAG_V2_ORG_CONTENT_ASSESSMENT,
    universityId: guarded.tenant.universityId,
  });

  return ok({
    tenantKey: guarded.tenant.tenantKey,
    actor: { id: guarded.tenant.actorUserId, role: guarded.tenant.role },
    result: {
      module: "org",
      enabled,
      routes: ["/api/v2/org/subjects"],
      status: enabled ? "active" : "disabled",
    },
  });
}
