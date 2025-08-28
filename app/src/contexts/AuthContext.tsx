// app/src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User, AuthResponse } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
};

// Respuesta “vacía” tipada (sin usar `any`)
const EMPTY_AUTH_RESPONSE: AuthResponse = {
  data: { user: null, session: null },
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => EMPTY_AUTH_RESPONSE,
  signUp: async () => EMPTY_AUTH_RESPONSE,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) Carga inicial
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      // console.log("[Auth] getSession done", !!data.session);
      setLoading(false);
    });

    // 2) Suscripción a cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evt, newSession) => {
        if (!mounted) return;
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        // console.log("[Auth] onAuth change", !!newSession);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextType["signIn"] = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp: AuthContextType["signUp"] = (email, password) =>
    supabase.auth.signUp({ email, password });

  const signOut: AuthContextType["signOut"] = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
