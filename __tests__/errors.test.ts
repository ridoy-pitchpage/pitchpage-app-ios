import { GENERIC, userFacingErrorMessage } from "@/lib/errors";

// The console line is the operator's copy of the original; the test only
// cares what the customer is shown.
beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => undefined));
afterEach(() => jest.restoreAllMocks());

it("never shows a sign-in provider's configuration error", () => {
  const raw = [
    "Unacceptable audience in id_token: [co.pitchpage.app]",
    "Unsupported provider: provider is not enabled",
    "Nonces mismatch",
  ];
  for (const message of raw) {
    const shown = userFacingErrorMessage(new Error(message));
    expect(shown).toBe(
      "That sign-in option isn't working right now. Sign in with your email and password instead.",
    );
  }
});

it("keeps the existing translations", () => {
  expect(userFacingErrorMessage(new Error("Invalid login credentials"))).toBe(
    "That email and password don't match. Try again.",
  );
  expect(userFacingErrorMessage(new Error("Failed to fetch"))).toBe(
    "Couldn't reach the server — check your connection and try again.",
  );
  expect(userFacingErrorMessage({})).toBe(GENERIC);
});
