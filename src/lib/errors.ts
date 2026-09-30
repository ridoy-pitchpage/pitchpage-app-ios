/**
 * Turning a thrown thing into a sentence a customer can act on.
 *
 * Ported from `src/lib/save-conflict.ts` in the web repo, which exists because
 * Supabase storage errors, failed fetches and Postgres policy violations all
 * surface as plain Errors whose `.message` was written for an operator: "Load
 * failed", "new row violates row-level security policy", "HTTP 413 error". Each
 * was being shown verbatim. Match on shape, translate, and keep the original in
 * the console for whoever has to debug it.
 *
 * Showing raw error text is a standing rule in both repos (master plan §20).
 */

export const GENERIC = "Something went wrong. Please try again.";

export const SAVE_CONFLICT_MESSAGE =
  "This page was updated somewhere else. Reload to get the latest version.";

/** The marker the web's save path throws, carried through the API as a 409. */
export const PITCH_SAVE_CONFLICT = "PITCH_SAVE_CONFLICT";

export function isSaveConflictError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const code = (err as { code?: unknown }).code;
    if (code === "PAGE_CONFLICT" || code === PITCH_SAVE_CONFLICT) return true;
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.includes(PITCH_SAVE_CONFLICT)) return true;
  }
  return false;
}

const TRANSLATIONS: Array<[RegExp, string]> = [
  [
    /failed to fetch|load failed|networkerror|network ?request ?failed|err_internet|offline|aborted/i,
    "Couldn't reach the server — check your connection and try again.",
  ],
  [
    /exceeded the maximum allowed size|payload too large|entity too large|http 413\b/i,
    "That file is too large to upload. Try a smaller one.",
  ],
  [
    /row-level security|permission denied|not authori[sz]ed|\bjwt\b|token.*expired|http 40[13]\b/i,
    "You're signed out — sign in again to continue.",
  ],
  [/object not found|http 404\b/i, "We couldn't find that file. Try uploading it again."],
  [
    // HTTP-scoped on purpose: a bare /\b5\d\d\b/ would also match a friendly
    // sentence that happens to mention a number in that range.
    /http 5\d\d\b|internal server error|service unavailable|timed? ?out/i,
    "The server had trouble with that. Give it a moment and try again.",
  ],
  // Config problems are ours, never the customer's, and must never name the
  // setting that is missing.
  [/missing [A-Z0-9_]{4,}|api[_ ]?key|env(ironment)? variable/i, GENERIC],
];

/** Supabase Auth messages, which are written for developers. */
const AUTH_TRANSLATIONS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "That email and password don't match. Try again."],
  [/email not confirmed/i, "Confirm your email address first — check your inbox."],
  [/user already registered|already been registered/i, "There's already an account with that email. Sign in instead."],
  [/password should be at least/i, "Password must be at least 6 characters."],
  [/unable to validate email|invalid email/i, "That doesn't look like an email address."],
  [/for security purposes|rate ?limit|too many requests/i, "Too many attempts. Wait a moment and try again."],
  [/same as the old password|should be different/i, "Choose a password you haven't used here before."],
];

export function userFacingErrorMessage(err: unknown): string {
  if (isSaveConflictError(err)) return SAVE_CONFLICT_MESSAGE;

  const message = err && typeof err === "object" ? (err as { message?: unknown }).message : undefined;
  if (typeof message !== "string" || message.length === 0) return GENERIC;

  for (const [pattern, friendly] of [...AUTH_TRANSLATIONS, ...TRANSLATIONS]) {
    if (pattern.test(message)) {
      console.error("userFacingErrorMessage:", message, err);
      return friendly;
    }
  }

  // An internal slug with no spaces ("unreadable-material") is a code, not a
  // sentence, and a very long message is a stack or a serialized validation
  // error. Neither belongs in front of a customer.
  if (!/\s/.test(message) || message.length > 180) {
    console.error("userFacingErrorMessage:", message, err);
    return GENERIC;
  }
  return message;
}
