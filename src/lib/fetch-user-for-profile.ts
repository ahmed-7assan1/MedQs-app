import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Shape consumed by `ProfileServerView` */
export type ProfileViewUser = {
  id: string;
  name: string;
  bio: string | null;
  image: string | null;
  phone: string | null;
  phoneVisible: boolean;
  createdAt: Date;
  points: number;
  hideRank: boolean;
  nickname: string | null;
  handle: string | null;
  studentId: string | null;
  isPrivate: boolean;
  instagramUrl: string | null;
  facebookUrl: string | null;
  university: { name: string } | null;
  semester: { name: string } | null;
  rank: { label: string; badge: string | null } | null;
  _count: { posts: number; quizAttempts: number };
};

const FALLBACK: Pick<
  ProfileViewUser,
  | "phone"
  | "phoneVisible"
  | "hideRank"
  | "nickname"
  | "isPrivate"
  | "instagramUrl"
  | "facebookUrl"
  | "handle"
> = {
  phone: null,
  phoneVisible: false,
  hideRank: false,
  nickname: null,
  isPrivate: false,
  instagramUrl: null,
  facebookUrl: null,
  handle: null,
};

const SELECT_FULL = {
  id: true,
  name: true,
  bio: true,
  image: true,
  phone: true,
  phoneVisible: true,
  createdAt: true,
  points: true,
  hideRank: true,
  nickname: true,
  handle: true,
  studentId: true,
  isPrivate: true,
  instagramUrl: true,
  facebookUrl: true,
  university: { select: { name: true } },
  semester: { select: { name: true } },
  rank: { select: { label: true, badge: true } },
  _count: { select: { posts: true, quizAttempts: true } },
} satisfies Prisma.UserSelect;

/** Older DBs: skip columns that are often missing if migrations were not applied */
const SELECT_COMPAT = {
  id: true,
  name: true,
  bio: true,
  image: true,
  createdAt: true,
  points: true,
  studentId: true,
  university: { select: { name: true } },
  semester: { select: { name: true } },
  rank: { select: { label: true, badge: true } },
  _count: { select: { posts: true, quizAttempts: true } },
} satisfies Prisma.UserSelect;

/** Minimal: core columns + rank label only (no badge) */
const SELECT_MIN = {
  id: true,
  name: true,
  bio: true,
  image: true,
  createdAt: true,
  points: true,
  studentId: true,
  university: { select: { name: true } },
  semester: { select: { name: true } },
  rank: { select: { label: true } },
  _count: { select: { posts: true, quizAttempts: true } },
} satisfies Prisma.UserSelect;

function shouldRetryProfileQuery(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientValidationError) return true;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P2022" || e.code === "P2010" || e.code === "P2011";
  }
  return false;
}

function normalizeRank(
  r: { label: string; badge?: string | null } | null
): { label: string; badge: string | null } | null {
  if (!r) return null;
  return { label: r.label, badge: r.badge ?? null };
}

function asProfileView(
  row: Record<string, unknown>,
  filled: Partial<ProfileViewUser>
): ProfileViewUser {
  return {
    id: row.id as string,
    name: row.name as string,
    bio: (row.bio as string | null) ?? null,
    image: (row.image as string | null) ?? null,
    phone: (filled.phone ?? null) as string | null,
    phoneVisible: filled.phoneVisible ?? false,
    createdAt: row.createdAt as Date,
    points: row.points as number,
    hideRank: filled.hideRank ?? false,
    nickname: (filled.nickname ?? null) as string | null,
    handle: (filled.handle ?? null) as string | null,
    studentId: (row.studentId as string | null) ?? null,
    isPrivate: filled.isPrivate ?? false,
    instagramUrl: (filled.instagramUrl ?? null) as string | null,
    facebookUrl: (filled.facebookUrl ?? null) as string | null,
    university: (row.university as { name: string } | null) ?? null,
    semester: (row.semester as { name: string } | null) ?? null,
    rank: normalizeRank(row.rank as { label: string; badge?: string | null } | null),
    _count: row._count as { posts: number; quizAttempts: number },
  };
}

/**
 * Loads a user for the profile page. Retries with smaller `select` when the DB or an outdated
 * generated client rejects the full query (missing columns → P2022, unknown fields → validation).
 */
export async function fetchUserForProfile(targetId: string): Promise<ProfileViewUser | null> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: targetId },
      select: SELECT_FULL,
    });
    if (!u) return null;
    return u as unknown as ProfileViewUser;
  } catch (e) {
    if (!shouldRetryProfileQuery(e)) throw e;
  }

  try {
    const u = await prisma.user.findUnique({
      where: { id: targetId },
      select: SELECT_COMPAT,
    });
    if (!u) return null;
    return asProfileView(u as unknown as Record<string, unknown>, { ...FALLBACK });
  } catch (e) {
    if (!shouldRetryProfileQuery(e)) throw e;
  }

  const u = await prisma.user.findUnique({
    where: { id: targetId },
    select: SELECT_MIN,
  });
  if (!u) return null;
  return asProfileView(u as unknown as Record<string, unknown>, { ...FALLBACK });
}
