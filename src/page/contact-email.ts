/**
 * Apple's "Hide My Email" addresses, and keeping them off a page.
 *
 * Sign in with Apple can hand the app a forwarding address instead of a real
 * one. Apple's relay only accepts mail from senders the app has registered,
 * so a visitor writing to it from their own mail is turned away: a page
 * showing it has a Contact button that cannot reach anybody (2026-10-09).
 */
// Both of Apple's relay domains: new Sign in with Apple addresses move to
// private.icloud.com "later this year" (Apple, 24 August 2026), and the old
// ones keep working. iCloud+ Hide My Email stays on icloud.com, and those
// addresses take mail from anyone, so they are not caught here.
const APPLE_RELAY = /@(?:privaterelay\.appleid\.com|private\.icloud\.com)$/i;

export function isAppleRelayEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && APPLE_RELAY.test(email.trim());
}

/** The address to put in a Contact section: the owner's, unless nobody can write to it. */
export function seedableEmail(email: string | null | undefined): string {
  const trimmed = typeof email === "string" ? email.trim() : "";
  return isAppleRelayEmail(trimmed) ? "" : trimmed;
}

/** Shown under an email field that holds one. */
export const RELAY_EMAIL_HINT =
  "Visitors can't reach Apple's Hide My Email address. Use the email you want them to write to.";
