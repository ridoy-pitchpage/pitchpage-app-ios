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

it("never names a database function that isn't applied yet", () => {
  const raw =
    "Could not find the function public.unpublish_pitch_page(_pitch_page_id) in the schema cache";
  expect(userFacingErrorMessage(new Error(raw))).toBe("That isn't available yet. Try again soon.");
});

it("passes the free-publishing cap through as it is written", () => {
  const cap = "You already have 3 pages live from the app. Take one offline to publish this one.";
  expect(userFacingErrorMessage(new Error(cap))).toBe(cap);
  const unavailable = "Taking a page offline isn't switched on yet. Try again soon.";
  expect(userFacingErrorMessage(new Error(unavailable))).toBe(unavailable);
});

it("still reads iOS's offline sentence as a connection problem", () => {
  expect(userFacingErrorMessage(new Error("The Internet connection appears to be offline."))).toBe(
    "Couldn't reach the server — check your connection and try again.",
  );
});
