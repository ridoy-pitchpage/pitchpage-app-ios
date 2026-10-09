import { hasPasswordSignIn, OFFER_APPLE_SIGN_IN, OFFER_GOOGLE_SIGN_IN } from "@/auth/sign-in-options";

it("never offers Google sign-in without Sign in with Apple (Guideline 4.8)", () => {
  expect(!OFFER_GOOGLE_SIGN_IN || OFFER_APPLE_SIGN_IN).toBe(true);
});

describe("hasPasswordSignIn", () => {
  const account = (...providers: string[]) => ({ app_metadata: { providers } });

  it("is true for every account with an email sign-in, linked or not", () => {
    expect(hasPasswordSignIn(account("email"))).toBe(true);
    expect(hasPasswordSignIn(account("email", "google", "apple"))).toBe(true);
  });

  it("is false for an account made with Apple or Google alone", () => {
    expect(hasPasswordSignIn(account("apple"))).toBe(false);
    expect(hasPasswordSignIn(account("google"))).toBe(false);
  });

  it("keeps the row for an account that doesn't say", () => {
    expect(hasPasswordSignIn({ app_metadata: {} })).toBe(true);
  });
});
