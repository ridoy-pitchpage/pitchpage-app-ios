// URL/URLSearchParams are incomplete in Hermes; supabase-js needs them.
import "react-native-url-polyfill/auto";

import { AppState, Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/config";
import type { Database } from "@/api/database.types";
import { sessionStorage } from "./session-storage";

/**
 * The same Supabase project the website uses, reached with the same publishable
 * key the web app ships to every browser. Accounts and pages are therefore
 * shared between web and app (master plan §1).
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    // A native app never returns from an OAuth redirect into its own URL bar;
    // the sign-in flow hands tokens over explicitly (§12).
    detectSessionInUrl: Platform.OS === "web",
  },
});

/**
 * Supabase's timer-based refresh keeps running while the app is backgrounded,
 * where iOS suspends timers and the token quietly goes stale. Tying it to the
 * foreground means the first request after a resume has a fresh token.
 */
export function startSessionRefreshWithAppState(): () => void {
  if (Platform.OS === "web") {
    supabase.auth.startAutoRefresh();
    return () => supabase.auth.stopAutoRefresh();
  }

  const apply = (state: string) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  };

  apply(AppState.currentState);
  const subscription = AppState.addEventListener("change", apply);

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
  };
}

/** The current access token, for calls to the app API (§9.1). */
export async function currentAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
