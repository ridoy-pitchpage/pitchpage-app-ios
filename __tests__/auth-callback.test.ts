import { AUTH_CALLBACK, bridgeStartUrl, parseAuthCallback } from "@/auth/auth-callback";

// The app's half of the website sign-in bridge. A callback is only used when
// it carries this request's state and both tokens; anything else is either a
// failure the person is told about or not an answer to this request at all.

const STATE = "s0123456789abcdef0123456789abcdef0123456789abcdef";

it("opens the website's bridge with the provider and state", () => {
  expect(bridgeStartUrl("https://pitchpage.co", "google", STATE)).toBe(
    `https://pitchpage.co/app-auth/start?provider=google&state=${STATE}`,
  );
});

it("takes the session from a callback that answers this request", () => {
  const url = `${AUTH_CALLBACK}#access_token=AT&refresh_token=RT&expires_in=3600&token_type=bearer&state=${STATE}`;
  expect(parseAuthCallback(url, STATE)).toEqual({ kind: "session", accessToken: "AT", refreshToken: "RT" });
});

it("refuses a callback with another request's state, even with tokens", () => {
  const url = `${AUTH_CALLBACK}#access_token=AT&refresh_token=RT&state=someone-elses-state-0000`;
  expect(parseAuthCallback(url, STATE)).toEqual({ kind: "mismatch" });
});

it("refuses a callback with no state", () => {
  expect(parseAuthCallback(`${AUTH_CALLBACK}#access_token=AT&refresh_token=RT`, STATE)).toEqual({ kind: "mismatch" });
});

it("refuses anything that isn't the app's callback", () => {
  const url = `https://evil.example/auth-callback#access_token=AT&refresh_token=RT&state=${STATE}`;
  expect(parseAuthCallback(url, STATE)).toEqual({ kind: "mismatch" });
});

it("reports the website's failure without passing its words on", () => {
  expect(parseAuthCallback(`${AUTH_CALLBACK}#error=sign_in_failed&state=${STATE}`, STATE)).toEqual({ kind: "failed" });
});

it("treats a callback missing a token as a failure", () => {
  expect(parseAuthCallback(`${AUTH_CALLBACK}#access_token=AT&state=${STATE}`, STATE)).toEqual({ kind: "failed" });
});
