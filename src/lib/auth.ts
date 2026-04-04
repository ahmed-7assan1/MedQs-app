import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CredentialsSchema = z.object({
  email:     z.string().email().optional(),
  studentId: z.string().min(1).optional(),
  password:  z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
        if (session.nickname !== undefined) token.nickname = session.nickname;
        if (session.hideRank !== undefined) token.hideRank = session.hideRank;
      }
      // Re-fetch role/semesterId from DB on every request (handles role changes)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true, semesterId: true, nickname: true, hideRank: true,
            name: true, image: true,
          },
        }).catch(() => null);
        if (dbUser) {
          token.role       = dbUser.role;
          token.semesterId = dbUser.semesterId;
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
        (session.user as any).role       = token.role;
        (session.user as any).semesterId = token.semesterId;
        (session.user as any).studentId  = token.studentId;
        (session.user as any).nickname   = token.nickname;
        (session.user as any).hideRank   = token.hideRank;
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
