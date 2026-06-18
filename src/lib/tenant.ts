import { prisma } from "@/lib/prisma";
import type { AuthSession as Session } from "@/lib/auth";

export type SessionScope = {
  userId: string;
  role: string | undefined;
  semesterId: string | null;
  universityId: string | null;
  facultyId: string | null;
  isLeader: boolean;
};

export async function getSessionScope(session: Session | null): Promise<SessionScope | null> {
  const userId = session?.user?.id;
  if (!userId) return null;
  const role = (session?.user as any)?.role as string | undefined;
  const tokenUni = (session?.user as any)?.universityId as string | undefined;
  const tokenSem = (session?.user as any)?.semesterId as string | undefined;

  // Prefer DB as source of truth (handles stale token fields).
  const db = await prisma.user
    .findUnique({ where: { id: userId }, select: { universityId: true, semesterId: true, facultyId: true, isLeader: true, role: true } })
    .catch(() => null);

  return {
    userId,
    role: db?.role ?? role,
    semesterId: db?.semesterId ?? (tokenSem ?? null),
    universityId: db?.universityId ?? (tokenUni ?? null),
    facultyId: db?.facultyId ?? null,
    isLeader: db?.isLeader ?? false,
  };
}

export function isAdminRole(role: unknown): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "LEADER";
}

export function isSuperAdmin(role: unknown): boolean {
  return role === "SUPER_ADMIN";
}

/** Returns true if this is a scoped ADMIN/LEADER (non-super) with a semester/faculty restriction */
export function isScopedAdmin(scope: SessionScope): boolean {
  return (scope.role === "ADMIN" || scope.role === "LEADER") && !!scope.semesterId;
}

