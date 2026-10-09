/**
 * Which third-party sign-ins the app offers: the switch to flip if one fails
 * on TestFlight.
 *
 * Both go through the website's sign-in bridge (pitchpage.co/app-auth/start
 * and /app-auth/finish), so they work only once that is published on the
 * website. If the bridge isn't live, or fails on TestFlight, turn them off here
 * rather than ship a button that errors in front of App Review (Guideline 2.1).
 *
 * Google is only ever offered beside Apple: an app with a third-party sign-in
 * has to offer Sign in with Apple too (Guideline 4.8), so turning Apple off
 * turns Google off with it. With both off the app is email-only, which needs
 * neither — a valid 1.0.
 */
const ENABLED = { apple: true, google: true };

export const OFFER_APPLE_SIGN_IN: boolean = ENABLED.apple;

export const OFFER_GOOGLE_SIGN_IN: boolean = ENABLED.google && ENABLED.apple;

/**
 * Whether an account signs in with an email and password, so has a password
 * to change. One made with Apple or Google has none, and "Change password"
 * would only set up a second way in that its owner never asked for. Supabase
 * lists every way an account signs in under app_metadata.providers; an
 * account without the list is treated as an email one, because hiding the row
 * from someone who needs it is worse than showing it to someone who doesn't.
 */
export function hasPasswordSignIn(user: { app_metadata?: { providers?: unknown } } | null): boolean {
  const providers = user?.app_metadata?.providers;
  return Array.isArray(providers) ? providers.includes("email") : true;
}
