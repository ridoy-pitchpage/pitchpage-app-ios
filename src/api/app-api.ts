import Constants from "expo-constants";

import { supabase } from "@/auth/supabase";
import { API_URL } from "@/lib/config";

/**
 * The app API in the web repo (master plan §9): `POST /api/app/v1/...` with
 * the Supabase access token as a bearer token. Every rule stays on the server;
 * this only carries the request and turns the answer into a value or an Error.
 *
 * Errors arrive as `{ error: { code, message } }` with the website's own
 * friendly sentences, so the message can go straight to a toast through
 * userFacingErrorMessage.
 */

export class AppApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AppApiError";
  }
}

/** AI calls take up to 30 seconds, and a cold server instance adds up to 20 (§9.1). */
const DEFAULT_TIMEOUT_MS = 60_000;

const GENERIC = "That didn't go through — please try again.";

async function post(path: string, token: string, body: unknown, signal: AbortSignal): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-app-version": Constants.expoConfig?.version ?? "unknown",
    },
    body: JSON.stringify(body),
    signal,
  });
}

export async function appApiPost<T>(
  path: string,
  body: unknown,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AppApiError("Please sign in again.", "UNAUTHORIZED", 401);

  // One controller for both the caller's cancel and the timeout, so either
  // stops the request; which one it was decides what the caller is told.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onCancel = () => controller.abort();
  options.signal?.addEventListener("abort", onCancel);

  try {
    let response = await post(path, token, body, controller.signal);
    // An access token can expire between reading it and the server checking
    // it. One refresh and one retry, then the 401 stands.
    if (response.status === 401) {
      const refreshed = await supabase.auth.refreshSession();
      const next = refreshed.data.session?.access_token;
      if (!refreshed.error && next) response = await post(path, next, body, controller.signal);
    }

    const payload = (await response.json().catch(() => null)) as
      | { error?: { code?: unknown; message?: unknown } }
      | null;
    if (!response.ok) {
      const error = payload?.error;
      throw new AppApiError(
        typeof error?.message === "string" ? error.message : GENERIC,
        typeof error?.code === "string" ? error.code : "INTERNAL",
        response.status,
      );
    }
    return payload as T;
  } catch (error) {
    // userFacingErrorMessage turns "timed out" into its own sentence.
    if (timedOut) throw new AppApiError("The request timed out.", "TIMEOUT", 0);
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onCancel);
  }
}
