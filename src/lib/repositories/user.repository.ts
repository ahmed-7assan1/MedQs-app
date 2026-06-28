import { prisma, withRetry } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const publicProfileSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  image: true,
  bio: true,
  role: true,
  points: true,
  handle: true,
  studentId: true,
  phone: true,
  phoneVisible: true,
  isPrivate: true,
  hideRank: true,
  coverImage: true,
  theme: true,
  instagramUrl: true,
  facebookUrl: true,
  universityId: true,
  facultyId: true,
  semesterId: true,
  lastLoginAt: true,
  lastActivityAt: true,
} as const satisfies Record<string, true>;

export type PublicProfile = Prisma.UserGetPayload<{ select: typeof publicProfileSelect }>;

export async function findUserById(id: string) {
  return withRetry(() =>
    prisma.user.findUnique({
      where: { id },
      select: publicProfileSelect,
    })
  );
}

export async function findUserByEmail(email: string) {
  return withRetry(() =>
    prisma.user.findUnique({
      where: { email },
      select: { ...publicProfileSelect, password: true },
    })
  );
}

export async function findUserByStudentId(studentId: string) {
  return withRetry(() =>
    prisma.user.findFirst({
      where: { studentId },
      select: { ...publicProfileSelect, password: true },
    })
  );
}

export async function findUserByHandle(handle: string) {
  return withRetry(() =>
    prisma.user.findUnique({
      where: { handle },
      select: publicProfileSelect,
    })
  );
}

export async function findUserWithRank(id: string) {
  return withRetry(() =>
    prisma.user.findUnique({
      where: { id },
      select: {
        ...publicProfileSelect,
        rank: { select: { label: true, badge: true, minPoints: true } },
        university: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
      },
    })
  );
}

export async function findUserForLogin(email?: string, studentId?: string) {
  return withRetry(() =>
    prisma.user.findFirst({
      where: email ? { email } : { studentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        password: true,
        universityId: true,
        semesterId: true,
        nickname: true,
        studentId: true,
      },
    })
  );
}

export async function updateUserProfile(
  id: string,
  data: Prisma.UserUpdateInput
) {
  return withRetry(() =>
    prisma.user.update({
      where: { id },
      data,
      select: publicProfileSelect,
    })
  );
}

export async function incrementUserPoints(id: string, points: number) {
  return withRetry(() =>
    prisma.user.update({
      where: { id },
      data: { points: { increment: points } },
      select: { points: true },
    })
  );
}

export async function findUsersByUniversity(universityId: string, skip = 0, take = 20) {
  return withRetry(() =>
    prisma.user.findMany({
      where: { universityId },
      select: publicProfileSelect,
      skip,
      take,
      orderBy: { points: "desc" },
    })
  );
}
