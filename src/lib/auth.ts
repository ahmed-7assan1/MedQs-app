import { createClient } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/redis";

export type AuthSession = {
  user: {
    id: string;
    email?: string;
    name?: string;
    image?: string;
    role: string;
    semesterId?: string;
    facultyId?: string;
    universityId?: string;
    studentId?: string;
    nickname?: string;
    facultyCategory?: string;
  };
  expires: string;
};

const AUTH_CACHE_TTL = 30;

function buildSessionFromUser(user: any): AuthSession {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";
  const isSuperAdmin = user.user_metadata?.role === "SUPER_ADMIN" || user.email === superAdminEmail;
  const userRole = isSuperAdmin ? "SUPER_ADMIN" : (user.user_metadata?.role || "STUDENT");

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
      image: user.user_metadata?.avatar_url || user.user_metadata?.image,
      role: userRole,
      semesterId: user.user_metadata?.semesterId,
      facultyId: user.user_metadata?.facultyId,
      universityId: user.user_metadata?.universityId,
      studentId: user.user_metadata?.studentId,
      nickname: user.user_metadata?.nickname,
      facultyCategory: user.user_metadata?.facultyCategory,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export const auth = async (): Promise<AuthSession | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cached = await cacheGet(`auth:${user.id}`).catch(() => null);
  if (cached) {
    try { return JSON.parse(cached) as AuthSession; } catch {}
  }

  const session = buildSessionFromUser(user);

  cacheSet(`auth:${user.id}`, JSON.stringify(session), AUTH_CACHE_TTL).catch(() => {});

  return session;
};

export const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
};
