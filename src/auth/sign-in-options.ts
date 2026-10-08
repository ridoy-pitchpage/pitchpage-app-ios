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
