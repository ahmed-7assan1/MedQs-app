import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export type SessionScope = {
  userId: string;
  role: string | undefined;
  semesterId: string | null;
  universityId: string | null;
};

export async function getSessionScope(session: Session | null): Promise<SessionScope | null> {
  const userId = session?.user?.id;
  if (!userId) return null;
  const role = (session?.user as any)?.role as string | undefined;
  const tokenUni = (session?.user as any)?.universityId as string | undefined;
  const tokenSem = (session?.user as any)?.semesterId as string | undefined;

  // Prefer DB as source of truth (handles stale token fields).
  const db = await prisma.user
    .findUnique({ where: { id: userId }, select: { universityId: true, semesterId: true } })
    .catch(() => null);

  return {
    userId,
    role,
    semesterId: db?.semesterId ?? (tokenSem ?? null),
    universityId: db?.universityId ?? (tokenUni ?? null),
  };
}

export function isAdminRole(role: unknown): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: unknown): boolean {
  return role === "SUPER_ADMIN";
}

