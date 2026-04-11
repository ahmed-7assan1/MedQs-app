import { prisma } from "@/lib/prisma";

export const FLAG_V2_ORG_CONTENT_ASSESSMENT = "v2_org_content_assessment";

export async function isFeatureEnabled(args: { key: string; universityId: string | null }) {
  const row = await prisma.featureFlag
    .findFirst({
      where: {
        key: args.key,
        OR: [
          { universityId: args.universityId ?? undefined },
          { universityId: null },
        ],
      },
      orderBy: [{ universityId: "desc" }, { updatedAt: "desc" }],
      select: { enabled: true },
    })
    .catch(() => null);
  return Boolean(row?.enabled);
}

export async function requireFeatureEnabled(args: { key: string; universityId: string | null }) {
  const enabled = await isFeatureEnabled(args);
  return enabled;
}
