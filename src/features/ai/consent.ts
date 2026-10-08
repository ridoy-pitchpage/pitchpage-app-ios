import { supabase } from "@/auth/supabase";

/**
 * Consent to send material to a third-party AI (App Store Guideline 5.1.2(i),
 * master plan S20), asked once per account before the first AI action.
 *
 * Kept in the account's own user metadata (`ai_consent_at`) rather than a new
 * profiles column (decided 2026-10-08): the person can always write their own
 * metadata, so this needs no schema change, and it follows them to any device
 * they sign in on. It records their own choice, which is all it has to prove.
 */

const KEY = "ai_consent_at";

export async function hasAiConsent(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return typeof data.user?.user_metadata?.[KEY] === "string";
}

export async function recordAiConsent(): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { [KEY]: new Date().toISOString() } });
  if (error) throw error;
}
