import type { TenantContext } from "@/platform/tenant/tenant-resolver";

export type PlatformRole = "SUPER_ADMIN" | "FACULTY_ADMIN" | "TEACHER" | "STUDENT";
export type PolicyAction =
  | "read"
  | "write"
  | "publish"
  | "grade"
  | "moderate"
  | "manage_roles"
  | "manage_tenant";
export type PolicyResource =
  | "lecture"
  | "quiz"
  | "question_bank"
  | "community"
  | "marketplace_course"
  | "user"
  | "tenant";

export type PolicyContext = {
  actor: TenantContext;
  ownerUserId?: string | null;
  sameTenant: boolean;
};

const roleHierarchy: Record<PlatformRole, number> = {
  STUDENT: 1,
  TEACHER: 2,
  FACULTY_ADMIN: 3,
  SUPER_ADMIN: 4,
};

function roleOf(value: string): PlatformRole {
  if (value === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (value === "ADMIN") return "FACULTY_ADMIN";
  if (value === "TEACHER") return "TEACHER";
  return "STUDENT";
}

export function can(action: PolicyAction, resource: PolicyResource, context: PolicyContext): boolean {
  const role = roleOf(context.actor.role);
  const level = roleHierarchy[role];

  if (role === "SUPER_ADMIN") return true;
  if (!context.sameTenant) return false;

  if (action === "read") return true;
  if (action === "manage_tenant" || action === "manage_roles") return level >= roleHierarchy.FACULTY_ADMIN;

  if (resource === "marketplace_course") {
    if (action === "write" || action === "publish") return level >= roleHierarchy.TEACHER;
  }

  if (resource === "community" && action === "moderate") return level >= roleHierarchy.FACULTY_ADMIN;
  if (resource === "quiz" && action === "grade") return level >= roleHierarchy.TEACHER;

  if (action === "write" || action === "publish") {
    if (level >= roleHierarchy.FACULTY_ADMIN) return true;
    if (context.ownerUserId && context.ownerUserId === context.actor.actorUserId) return true;
  }

  return false;
}
