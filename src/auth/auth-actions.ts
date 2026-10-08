import type { User } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";

import { SITE_URL } from "@/lib/config";
import { AUTH_CALLBACK, bridgeStartUrl, parseAuthCallback, type BridgeProvider } from "./auth-callback";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

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

/**
 * Google or Apple, through the website's sign-in bridge (master plan §12).
 *
 * The project's Google and Apple sign-in are Lovable-managed: the website signs
 * in through Lovable's OAuth broker, which holds the providers' credentials.
 * Asking Supabase directly failed both ways on a real iPhone — Google with
 * redirect_uri_mismatch, Apple with "Unacceptable audience in id_token" — so
 * the app runs the website's own sign-in instead, in an ephemeral
 * authentication sheet, and takes the session the bridge hands back.
 *
 * The state is checked before anything is used: iOS only returns the callback
 * to the sheet that opened it, and the state proves it answers this request.
 */
export async function signInWithProvider(provider: BridgeProvider): Promise<boolean> {
  const name = provider === "apple" ? "Apple" : "Google";
  if (Platform.OS === "web") {
    // The bridge ends at pitchpage://, which only the installed app answers.
    throw new Error(`Sign in with ${name} works in the iPhone app. Use your email and password here.`);
  }

  // Starts with a letter, so no URL parser along the way reads it as a number.
  const state = `s${Array.from(Crypto.getRandomBytes(24), (b) => b.toString(16).padStart(2, "0")).join("")}`;
  const result = await WebBrowser.openAuthSessionAsync(
    bridgeStartUrl(SITE_URL, provider, state),
    AUTH_CALLBACK,
    { preferEphemeralSession: true },
  );
  if (result.type === "cancel" || result.type === "dismiss") return false;
  if (result.type !== "success") throw new Error(`Couldn't connect to ${name}. Please try again.`);

  const callback = parseAuthCallback(result.url, state);
  if (callback.kind !== "session") {
    throw new Error(`Couldn't finish signing in with ${name}. Please try again.`);
  }
  const { error } = await supabase.auth.setSession({
    access_token: callback.accessToken,
    refresh_token: callback.refreshToken,
  });
  if (error) throw error;

  const { data: auth, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (auth.user) await ensureProfile(auth.user);
  return true;
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
