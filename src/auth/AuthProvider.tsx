import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

import { startSessionRefreshWithAppState, supabase } from "./supabase";
import { useDraft } from "@/state/draft-store";

type AuthValue = {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been read; the splash waits on this. */
  loading: boolean;
  signedIn: boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** The signed-in user, or null. Most screens want this rather than the session. */
export function useUser(): User | null {
  return useAuth().user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let ownerId: string | null = null;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) {
          ownerId = data.session?.user.id ?? null;
          setSession(data.session);
        }
      })
      .catch(() => {
        // A session that cannot be read is a signed-out app, not a crash.
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      const nextOwnerId = next?.user.id ?? null;
      if (event === "SIGNED_OUT" || (ownerId !== null && ownerId !== nextOwnerId)) {
        useDraft.getState().clear();
        queryClient.clear();
      }
      ownerId = nextOwnerId;
      setSession(next);
      // Cached rows belong to whoever was signed in; a sign-out or a switch has
      // to drop them or the next user briefly sees the last one's pages.
      if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.clear();
      }
    });

    const stopRefresh = startSessionRefreshWithAppState();

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      stopRefresh();
    };
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({ session, user: session?.user ?? null, loading, signedIn: session != null }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
