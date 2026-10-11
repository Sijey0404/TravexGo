import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "../types/database";
import { getProfile } from "../lib/data";
import { supabase } from "../lib/supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};
const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => {},
  });

  useEffect(() => {
    if (!supabase) {
      setState({ session: null, user: null, profile: null, loading: false, refreshProfile: async () => {} });
      return;
    }
    let alive = true;
    const load = async (session: Session | null) => {
      try {
        const profile = session?.user
          ? await getProfile(session.user.id)
          : null;
        if (alive)
          setState((current) => ({
            ...current,
            session,
            user: session?.user ?? null,
            profile,
            loading: false,
          }));
      } catch {
        if (alive)
          setState((current) => ({
            ...current,
            session,
            user: session?.user ?? null,
            profile: null,
            loading: false,
          }));
      }
    };
    void supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void load(session);
      },
    );
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!state.user) return;
    const profile = await getProfile(state.user.id);
    setState((current) => ({ ...current, profile }));
  };

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
