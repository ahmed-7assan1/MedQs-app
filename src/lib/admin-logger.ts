import { prisma } from "@/lib/prisma";

type EntityType =
  | "USER" | "QUESTION" | "LECTURE" | "PAST_PAPER" | "POST" | "COMMENT"
  | "SETTING" | "FILE" | "AD" | "FORUM" | "WARNING" | "REPORT"
  | "QUIZ" | "FLASHCARD" | "NOTE" | "SITE_CONFIG";

type ActionType =
  | "CREATE" | "UPDATE" | "DELETE" | "BULK_DELETE" | "EXPORT"
  | "LOGIN" | "BAN" | "UNBAN" | "WARN" | "BULK_CHANGE_ROLE"
  | "BULK_BAN" | "BULK_WARN" | "BULK_ADD_POINTS" | "BULK_NOTIFY";

interface LogAdminActionParams {
  adminId: string;
  action: ActionType;
  entityType: EntityType;
  entityId?: string | null;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAdminAction(params: LogAdminActionParams) {
  try {
    await prisma.adminActionLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        previousState: params.previousState ?? undefined as any,
        newState: params.newState ?? undefined as any,
        description: params.description ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ?? undefined as any,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[admin-logger] failed to log action:", err instanceof Error ? err.message : err);
    }
  }
}

export async function logBulkAdminAction(params: {
  adminId: string;
  action: ActionType;
  entityType: EntityType;
  entityIds: string[];
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  return logAdminAction({
    adminId: params.adminId,
    action: params.action,
    entityType: params.entityType,
    description: params.description ?? `Bulk ${params.action} on ${params.entityIds.length} ${params.entityType.toLowerCase()}s`,
    metadata: { ...params.metadata, entityIds: params.entityIds },
  });
}
