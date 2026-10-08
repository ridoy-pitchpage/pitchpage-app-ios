/**
 * The website's sign-in bridge, from the app's side (master plan §10.3, §12).
 *
 * pitchpage.co/app-auth/start runs the website's own Lovable sign-in for Google
 * or Apple; /app-auth/finish hands the new session back to
 * pitchpage://auth-callback. The app opens that in an ephemeral authentication
 * session, so iOS returns the callback only to the session that asked for it,
 * and `state` lets the app check the callback is the answer to its own request.
 *
 * Pure, so the parsing is tested without a phone. The website side lives in
 * the web repo's src/lib/app-auth-bridge.ts.
 */

export type BridgeProvider = "google" | "apple";

/** Where the website sends the result. It is the only target it ever uses. */
export const AUTH_CALLBACK = "pitchpage://auth-callback";

export function bridgeStartUrl(site: string, provider: BridgeProvider, state: string): string {
  return `${site}/app-auth/start?provider=${provider}&state=${encodeURIComponent(state)}`;
}

export type CallbackResult =
  | { kind: "session"; accessToken: string; refreshToken: string }
  | { kind: "failed" }
  /** Not an answer to this request: a stale or forged callback. */
  | { kind: "mismatch" };

export function parseAuthCallback(url: string, expectedState: string): CallbackResult {
  if (!url.startsWith(AUTH_CALLBACK)) return { kind: "mismatch" };
  const hashIndex = url.indexOf("#");
  const params = new URLSearchParams(hashIndex === -1 ? "" : url.slice(hashIndex + 1));
  if (params.get("state") !== expectedState) return { kind: "mismatch" };
  if (params.get("error")) return { kind: "failed" };
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return { kind: "failed" };
  return { kind: "session", accessToken, refreshToken };
}
