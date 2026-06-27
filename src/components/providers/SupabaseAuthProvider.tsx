"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true, signOut: async () => {},
});

const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const isLanding = typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname.startsWith("/#"));

    const getSession = async () => {
      if (isLanding) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    let refreshInterval: NodeJS.Timeout | undefined;
    if (!isLanding) {
      refreshInterval = setInterval(async () => {
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session) {
          setSession(session);
          setUser(session.user ?? null);
        }
      }, SESSION_REFRESH_INTERVAL);
    }

    return () => {
      subscription.unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
