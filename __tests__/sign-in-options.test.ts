import { OFFER_APPLE_SIGN_IN, OFFER_GOOGLE_SIGN_IN } from "@/auth/sign-in-options";

it("never offers Google sign-in without Sign in with Apple (Guideline 4.8)", () => {
  expect(!OFFER_GOOGLE_SIGN_IN || OFFER_APPLE_SIGN_IN).toBe(true);
});
