/**
 * Which third-party sign-ins the app offers: the switch to flip if one fails
 * on TestFlight.
 *
 * Both need backend settings that only a real iPhone build can prove. Apple
 * needs this app's bundle ID (co.pitchpage.app) among the Apple provider's
 * client IDs; Google needs pitchpage://auth-callback among the allowed
 * redirect URLs. If either fails, turn it off here rather than ship a button
 * that errors in front of App Review (Guideline 2.1).
 *
 * Google is only ever offered beside Apple: an app with a third-party sign-in
 * has to offer Sign in with Apple too (Guideline 4.8), so turning Apple off
 * turns Google off with it. With both off the app is email-only, which needs
 * neither — a valid 1.0.
 */
const ENABLED = { apple: true, google: true };

export const OFFER_APPLE_SIGN_IN: boolean = ENABLED.apple;

export const OFFER_GOOGLE_SIGN_IN: boolean = ENABLED.google && ENABLED.apple;
