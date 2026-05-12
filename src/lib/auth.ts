import { createClient } from "@/lib/supabase/server";

export const auth = async () => {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Return a session object compatible with NextAuth
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        image: user.user_metadata?.avatar_url || user.user_metadata?.image,
        role: user.user_metadata?.role,
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
  GET: () => new Response("Supabase Auth Active", { status: 200 }),
  POST: () => new Response("Supabase Auth Active", { status: 200 }),
};
