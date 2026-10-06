import { Linking } from "react-native";

import { CREDITS_URL, openCreditsCheckout } from "@/features/credits/web-checkout";

jest.mock("@/lib/config", () => ({ SITE_URL: "https://pitchpage.co" }));

/**
 * Buying credits is a link to the website, allowed on the US storefront only
 * because it leaves the app (Guideline 3.1.1(a)). These hold the two things
 * that keep it allowed: where it goes, and that it goes there in Safari.
 */

it("goes to the website's own credits page, with nothing about the person in the URL", () => {
  expect(CREDITS_URL).toBe("https://pitchpage.co/credits");
});

it("opens it in Safari, outside the app, rather than in an in-app browser", async () => {
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  await openCreditsCheckout();
  expect(open).toHaveBeenCalledWith("https://pitchpage.co/credits");
});
