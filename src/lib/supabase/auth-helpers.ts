import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.MOBILE_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
  );

export async function createMobileToken(user: {
  id: string;
  role?: string;
  semesterId?: string | null;
  universityId?: string | null;
  nickname?: string | null;
  studentId?: string | null;
}) {
  const token = await new SignJWT({
    id: user.id,
    sub: user.id,
    role: user.role,
    semesterId: user.semesterId,
    universityId: user.universityId,
    nickname: user.nickname,
    studentId: user.studentId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  return token;
}

export async function verifyMobileToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as Record<string, any>;
  } catch {
    return null;
  }
}

export async function getServerToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyMobileToken(authHeader.slice(7));
}
