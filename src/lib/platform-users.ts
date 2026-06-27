import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-logger";
import type { Role, WarningSeverity } from "@prisma/client";

interface BulkActionParams {
  action: "changeRole" | "ban" | "unban" | "warn" | "addPoints" | "notify";
  userIds: string[];
  payload: Record<string, unknown>;
  adminId: string;
}

export async function bulkActionUsers(params: BulkActionParams) {
  const { action, userIds, payload, adminId } = params;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });

  if (users.length !== userIds.length) {
    const found = new Set(users.map((u) => u.id));
    const missing = userIds.filter((id) => !found.has(id));
    throw new Error(`Some users not found: ${missing.join(", ")}`);
  }

  return prisma.$transaction(async (tx) => {
    switch (action) {
      case "changeRole": {
        const { role } = payload as { role: Role };
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { role },
        });
        break;
      }
      case "ban": {
        const { reason } = payload as { reason?: string };
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { isBanned: true, bannedAt: new Date(), banReason: reason ?? null },
        });
        break;
      }
      case "unban": {
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { isBanned: false, bannedAt: null, banReason: null },
        });
        break;
      }
      case "warn": {
        const { severity, reason, expiresAt } = payload as {
          severity?: WarningSeverity;
          reason: string;
          expiresAt?: string;
        };
        const warnings = userIds.map((userId) => ({
          userId,
          issuedById: adminId,
          severity: severity ?? "MODERATE" as WarningSeverity,
          reason: reason ?? "No reason provided",
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }));
        for (const w of warnings) {
          await tx.warning.create({ data: w });
        }
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { warningCount: { increment: 1 } },
        });
        break;
      }
      case "addPoints": {
        const { points, reason } = payload as { points: number; reason?: string };
        await tx.userPointsTransaction.createMany({
          data: userIds.map((userId) => ({
            userId,
            points,
            reason: reason ?? "Bulk add points",
            reference: `bulk_addPoints_${Date.now()}`,
          })),
        });
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { points: { increment: points } },
        });
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    await logAdminAction({
      adminId,
      action: `BULK_${action.toUpperCase()}` as any,
      entityType: "USER",
      description: `Bulk ${action} on ${userIds.length} users`,
      metadata: { userIds, payload },
    });
  });
}
