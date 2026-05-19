import { createClient } from "@/lib/supabase/server";

export const auth = async () => {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Return a session object compatible with NextAuth
    const isSuperAdmin = user.user_metadata?.role === "SUPER_ADMIN" || user.email === "ahmedhassan0business@gmail.com";
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
  } catch (e) {
    return null;
  }
};

export const signIn = async (provider?: string, options?: any) => {
  // Mock signIn for redirect logic or legacy calls
  // In Supabase, signIn is handled by the client
  return { url: "/login" }; 
};

export const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
};

export const handlers = {
  GET: async () => {
    try {
      const session = await auth();
      return new Response(JSON.stringify(session || {}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  POST: () => new Response("Supabase Auth Active", { status: 200 }),
};
