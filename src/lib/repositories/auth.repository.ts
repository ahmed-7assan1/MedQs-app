import { prisma } from "@/lib/prisma";

export type UserWithPassword = {
  id: string;
  name: string | null;
  email: string | null;
  password: string | null;
  role: string;
  universityId: string | null;
  semesterId: string | null;
  facultyId: string | null;
};

export type UserForLogin = {
  id: string;
  email: string | null;
  password: string | null;
  name: string | null;
  image: string | null;
  role: string;
  universityId: string | null;
};

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      password: true,
      universityId: true,
      semesterId: true,
      facultyId: true,
    },
  });
}

export async function findUserForLogin(email: string): Promise<UserForLogin | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      image: true,
      role: true,
      universityId: true,
    },
  });
}

export async function updatePassword(userId: string, hashedPassword: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      points: true,
      universityId: true,
      semesterId: true,
      facultyId: true,
    },
  });
}
