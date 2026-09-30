import type { User } from "@supabase/supabase-js";

import { SITE_URL } from "@/lib/config";
import { supabase } from "./supabase";

/**
 * Sign-in, sign-up and password reset, matching the web app's `/auth` route
 * rule for rule so the same account behaves the same in both places.
 */

export type Credentials = { email: string; password: string };

/** The web's `credentialProblem`, unchanged — including the 6-character floor. */
export function credentialProblem(creds: Credentials, mode: "signin" | "signup"): string | null {
  if (!creds.email.trim()) return "Enter your email.";
  if (!creds.password) return "Enter your password.";
  if (mode === "signup" && creds.password.length < 6) return "Password must be at least 6 characters.";
  return null;
}

/**
 * The web's `ensureProfile`. `ignoreDuplicates` matters: it must never
 * overwrite a display name the user has since changed, and Paige reads that
 * name from the account server-side to greet them.
 */
export async function ensureProfile(user: Pick<User, "id" | "user_metadata">): Promise<void> {
  const meta = user.user_metadata ?? {};
  const displayName =
    typeof meta.display_name === "string"
      ? meta.display_name
      : typeof meta.full_name === "string"
        ? meta.full_name
        : null;
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: user.id, display_name: displayName, avatar_url: avatarUrl },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

  // Never fatal: a missing profile row costs a personalised greeting, not access.
  if (error) console.error("Profile creation failed:", { userId: user.id, error });
}

export async function signInWithPassword(creds: Credentials): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: creds.email.trim(),
    password: creds.password,
  });
  if (error) throw error;
  if (data.user) await ensureProfile(data.user);
}

export type SignUpResult = { needsEmailConfirmation: boolean };

export async function signUpWithPassword(
  creds: Credentials,
  displayName: string,
): Promise<SignUpResult> {
  const name = displayName.trim();
  const { data, error } = await supabase.auth.signUp({
    email: creds.email.trim(),
    password: creds.password,
    options: {
      // Both keys, as the web sends them: `ensureProfile` reads display_name
      // and falls back to full_name.
      data: { display_name: name, full_name: name },
      // Email confirmation is switched off on this project today. If it is ever
      // turned on, this link lands on the website, which handles it as it does
      // for its own signups.
      emailRedirectTo: `${SITE_URL}/auth`,
    },
  });
  if (error) throw error;

  if (data.session && data.user) {
    await ensureProfile(data.user);
    return { needsEmailConfirmation: false };
  }
  return { needsEmailConfirmation: true };
}

/**
 * A reset link lands on the website's own `/reset-password`. Once the app
 * claims that path as a universal link it will open here instead; until the
 * association file ships, the website handles it exactly as it does today
 * (master plan §12, spike S1).
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${SITE_URL}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/**
 * Local scope on purpose. The website signs out globally, which would end this
 * app's session too; the app should not do the same in reverse (issue W-3).
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}
