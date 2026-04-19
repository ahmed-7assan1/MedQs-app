import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CredentialsSchema = z.object({
  email:     z.string().email().optional(),
  studentId: z.string().min(1).optional(),
  password:  z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use the incoming Host when building OAuth redirect_uri (needed on Vercel etc. if URL env drifts).
  trustHost: true,
  adapter: PrismaAdapter(prisma as unknown as PrismaClient),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId:     process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email:     { label: "Email",      type: "email" },
        studentId: { label: "Student ID", type: "text" },
        password:  { label: "Password",   type: "password" },
      },
      async authorize(rawCreds) {
        const parsed = CredentialsSchema.safeParse(rawCreds);
        if (!parsed.success) return null;
        const { email, studentId, password } = parsed.data;

        // Find user by email OR studentId
        const user = await prisma.user.findFirst({
          where: email
            ? { email }
            : studentId
            ? { studentId }
            : undefined,
        });

        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id         = user.id;
        token.role       = (user as any).role;
        token.semesterId = (user as any).semesterId;
        token.universityId = (user as any).universityId;
        token.facultyId  = (user as any).facultyId;
        token.studentId  = (user as any).studentId;
        token.nickname   = (user as any).nickname;
        token.hideRank   = (user as any).hideRank;
      }
      // Legacy / edge: some JWTs only had `sub` (still the DB user id with Prisma adapter)
      if (!token.id && token.sub) {
        token.id = token.sub as string;
      }
      if (trigger === "update" && session) {
        if (session.semesterId) token.semesterId = session.semesterId;
        if ((session as any).universityId) token.universityId = (session as any).universityId;
        if (session.nickname !== undefined) token.nickname = session.nickname;
        if (session.hideRank !== undefined) token.hideRank = session.hideRank;
      }
      // Re-fetch role/semesterId from DB on every request (handles role changes)
      if (token.id) {
        const dbUser = await (prisma as any).user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true, semesterId: true, universityId: true, facultyId: true, nickname: true, hideRank: true,
            name: true, image: true,
            faculty: { select: { category: true } }
          },
        }).catch(() => null);
        if (dbUser) {
          token.role       = dbUser.role;
          token.semesterId = dbUser.semesterId;
          token.universityId = dbUser.universityId;
          token.facultyId  = dbUser.facultyId;
          token.facultyCategory = dbUser.faculty?.category;
          token.nickname   = dbUser.nickname;
          token.hideRank   = dbUser.hideRank;
          if (dbUser.name) token.name = dbUser.name;
          token.picture = dbUser.image ?? undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const uid = (token.id as string | undefined) || (token.sub as string | undefined);
        if (uid) session.user.id = uid;
        (session.user as any).role            = token.role;
        (session.user as any).semesterId      = token.semesterId;
        (session.user as any).universityId    = (token as any).universityId;
        (session.user as any).facultyId       = (token as any).facultyId;
        (session.user as any).facultyCategory = (token as any).facultyCategory;
        (session.user as any).studentId       = token.studentId;
        (session.user as any).nickname        = token.nickname;
        (session.user as any).hideRank        = token.hideRank;
        if (typeof token.name === "string") session.user.name = token.name;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
});
