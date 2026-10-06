import { Linking } from "react-native";

import { SITE_URL } from "@/lib/config";

/**
 * Buying credits: on pitchpage.co, in Safari, on the US storefront only.
 *
 * Guideline 3.1.1(a) lets apps on the United States storefront include buttons
 * and links to other ways of buying; on every other storefront they may not.
 * So PitchPage is offered on the US App Store only, and this is the app's one
 * way into a purchase: the website's own credits page, where the existing
 * Stripe checkout runs and the server adds the credits. Nothing about the
 * purchase happens in the app — no card form, no Stripe sheet, no web view of
 * the checkout, all of which Apple rejects for something used inside the app.
 *
 * Safari rather than the in-app browser, deliberately: the purchase should be
 * plainly outside the app, the arrangement the guideline describes. Safari does
 * not share the app's session, so somebody signed out there goes through the
 * website's sign-in, which sends them back to /credits (its `next` parameter).
 * Nothing about them goes in the URL.
 *
 * Before the app is offered outside the US it needs In-App Purchase beside
 * this, and this link hidden on other storefronts (master plan §13).
 */
export const CREDITS_URL = `${SITE_URL}/credits`;

export async function openCreditsCheckout(): Promise<void> {
  await Linking.openURL(CREDITS_URL);
}
