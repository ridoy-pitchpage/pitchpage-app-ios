import { useCallback, useEffect, useRef, useState, type ElementRef, type ReactNode } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { useToast } from "@/components/Toast";
import { RENDER_URL } from "@/lib/config";
import { openPageLink } from "./page-links";
import type { PublicData } from "./to-public-data";
import { themeForTemplate } from "./template-theme";

/**
 * A page, drawn by the website's own layouts.
 *
 * The app draws pages itself everywhere else, through five archetypes for
 * thirty families, so the builder could not show the template that had been
 * picked: the picker previewed the website's rendering, and the screen after it
 * switched to the app's approximation. This draws the page through
 * /app-render instead, which renders PublicPitchView — the same component a
 * published page uses — from the draft the builder is holding.
 *
 * THE FALLBACK IS NOT OPTIONAL. A push to the website does not deploy it;
 * someone publishes by hand in Lovable. Until /app-render answers, and
 * whenever it cannot (offline, an old site, a slow first load), the app's own
 * renderer is on screen, so the builder is never blank. The website's version
 * replaces it only after the route says it is ready, and only then.
 *
 *   ready  ->  the app sends { render, page, editing }  ->  the page draws
 *   tap    ->  the app opens its own editor for what was tapped
 */

export type SurfaceTarget =
  | { kind: "section"; sectionId: string }
  | { kind: "details" }
  | { kind: "video" };

type State = "connecting" | "live" | "unavailable";

/** Long enough for a cold first load on a phone; short enough not to matter. */
const READY_TIMEOUT_MS = 20000;

/**
 * Whether /app-render answered the last time anything asked, for as long as
 * the app is running.
 *
 * A loading state is only acceptable if it is brief. Before /app-render is
 * published, every builder open would otherwise sit on the loader for the
 * whole timeout and then fall back — so once one attempt has failed, later
 * ones go straight to the fallback. Cleared by a restart, which is when a
 * newly published website would be found.
 */
let sessionAvailability: "unknown" | "available" | "unavailable" = "unknown";
/** Typing re-renders the page; one per pause is plenty. */
const SEND_DEBOUNCE_MS = 150;

const RENDER_ORIGIN = (() => {
  try {
    return new URL(RENDER_URL).origin;
  } catch {
    return "";
  }
})();

function parse(raw: unknown): { type: string; target?: SurfaceTarget } | null {
  let data = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (typeof data !== "object" || data === null) return null;
  const message = data as { type?: unknown; target?: unknown };
  if (typeof message.type !== "string") return null;
  if (message.type !== "tap") return { type: message.type };

  const target = message.target as { kind?: unknown; sectionId?: unknown } | undefined;
  if (target?.kind === "section" && typeof target.sectionId === "string") {
    return { type: "tap", target: { kind: "section", sectionId: target.sectionId } };
  }
  if (target?.kind === "details" || target?.kind === "video") {
    return { type: "tap", target: { kind: target.kind } };
  }
  return null;
}

export function RenderSurface({
  page,
  editing,
  onTap,
  fallback,
  header,
  bottomInset = 0,
}: {
  page: PublicData;
  editing: boolean;
  onTap?: (target: SurfaceTarget) => void;
  /** What shows until the website's rendering is ready, and if it never is. */
  fallback: ReactNode;
  header?: ReactNode;
  /** Room left for a toolbar floating over the bottom of the page. */
  bottomInset?: number;
}) {
  const [state, setState] = useState<State>(() =>
    sessionAvailability === "unavailable" ? "unavailable" : "connecting",
  );
  // Decided once, at mount: a surface already known to be unreachable is not
  // loaded at all, so it cannot answer late and swap the page under somebody.
  const [mountSurface] = useState(() => sessionAvailability !== "unavailable");
  const ready = useRef(false);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const webview = useRef<ElementRef<typeof WebView> | null>(null);
  // Held in a ref so a parent re-rendering with a new closure does not
  // re-bind the message listener — and drop a tap mid-flight. Updated in an
  // effect, never during render, so a render React throws away cannot leave
  // a stale handler behind.
  const tapRef = useRef(onTap);
  useEffect(() => {
    tapRef.current = onTap;
  }, [onTap]);

  const toast = useToast();
  const openLink = useCallback(
    (url: string) => void openPageLink(url).catch((error: unknown) => toast.error(error)),
    [toast],
  );

  const send = useCallback(
    (message: Record<string, unknown>) => {
      const payload = JSON.stringify(message);
      if (Platform.OS === "web") {
        frame.current?.contentWindow?.postMessage(payload, RENDER_ORIGIN || "*");
      } else {
        // Delivered as a real MessageEvent, which is what the route listens
        // for. JSON.stringify twice: once for the payload, once to make it a
        // safe JavaScript string literal inside the injected script.
        webview.current?.injectJavaScript(
          `window.dispatchEvent(new MessageEvent("message",{data:${JSON.stringify(payload)}}));true;`,
        );
      }
    },
    [],
  );

  const handle = useCallback((raw: unknown) => {
    const message = parse(raw);
    if (!message) return;
    if (message.type === "ready") {
      ready.current = true;
      sessionAvailability = "available";
      setState("live");
    } else if (message.type === "tap" && message.target) {
      tapRef.current?.(message.target);
    } else if (message.type === "error") {
      setState("unavailable");
    }
  }, []);

  // Give up, quietly, if the route never says it is ready — which is exactly
  // what happens before it has been published.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ready.current) {
        sessionAvailability = "unavailable";
        setState("unavailable");
      }
    }, READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // The iframe answers through window messages. Only ITS messages, from ITS
  // origin, are trusted: anything else on the page could post a "tap".
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (RENDER_ORIGIN && event.origin !== RENDER_ORIGIN) return;
      handle(event.data);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handle]);

  // Every change to the draft re-renders the page, once the route can hear it.
  useEffect(() => {
    if (state !== "live") return;
    const timer = setTimeout(() => send({ type: "render", page, editing }), SEND_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state, page, editing, send]);

  const live = state === "live";
  const { ground, inkMuted } = themeForTemplate(page.template);

  return (
    <View style={{ flex: 1 }}>
      {header}
      <View style={{ flex: 1, paddingBottom: bottomInset }}>
        {mountSurface ? (
          // Mounted while connecting, but invisible: it has to load to say it
          // is ready, and display:none would stop some browsers loading it.
          <View
            style={[StyleSheet.absoluteFill, { bottom: bottomInset, opacity: live ? 1 : 0 }]}
            pointerEvents={live ? "auto" : "none"}
            accessibilityElementsHidden={!live}
            importantForAccessibility={live ? "auto" : "no-hide-descendants"}
          >
            {Platform.OS === "web" ? (
              <iframe
                ref={frame}
                src={RENDER_URL}
                title="Your page"
                style={{ border: 0, width: "100%", height: "100%" }}
              />
            ) : (
              <WebView
                ref={webview}
                source={{ uri: RENDER_URL }}
                onMessage={(event: WebViewMessageEvent) => handle(event.nativeEvent.data)}
                onError={() => setState("unavailable")}
                onHttpError={() => setState("unavailable")}
                // The page draws in place; nothing in it may navigate the view
                // somewhere else, in edit mode or out of it. Frames inside it
                // are not the view: a film clip from YouTube loads in one. A
                // link somebody taps opens outside the page instead. While
                // editing, the route turns taps into edits, so none arrive.
                onShouldStartLoadWithRequest={(request: {
                  url: string;
                  isTopFrame?: boolean;
                  navigationType?: string;
                }) => {
                  if (request.url.startsWith(RENDER_URL) || request.isTopFrame === false) return true;
                  if (request.navigationType === "click") openLink(request.url);
                  return false;
                }}
                // The templates open a CV or a profile with target="_blank",
                // which asks for a new window rather than navigating.
                onOpenWindow={(event: { nativeEvent: { targetUrl: string } }) =>
                  openLink(event.nativeEvent.targetUrl)
                }
                // Every link has to reach the two handlers above. The view's
                // own default sends a non-web link to Linking.canOpenURL, which
                // iOS answers "no" for any scheme the app hasn't declared, so
                // the Contact button's mailto: was dropped without a word.
                originWhitelist={["*"]}
                style={{ flex: 1, backgroundColor: "transparent" }}
              />
            )}
          </View>
        ) : null}

        {/*
          While connecting: a loader, NOT the app's own rendering. Showing the
          approximation first and then swapping to the real template is the
          worst of both — the screen visibly changes design under the person
          looking at it. The loader is painted in the template's own ground, so
          the page arrives as a fade rather than a flash.
        */}
        {state === "connecting" ? (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: ground }]}
            className="items-center justify-center gap-3"
            accessibilityRole="progressbar"
            accessibilityLabel="Loading your page"
          >
            <ActivityIndicator color={inkMuted} />
            <Text style={{ color: inkMuted, fontSize: 13 }}>Loading your template…</Text>
          </View>
        ) : null}

        {/* Only when the website cannot draw it: offline, or not yet published. */}
        {state === "unavailable" ? (
          <View style={StyleSheet.absoluteFill}>{fallback}</View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Loads /app-render once, invisibly, as soon as somebody is signed in.
 *
 * Two jobs. It warms the cache, so that by the time a page is opened the
 * website's renderer is already downloaded and the builder shows the real
 * template almost at once rather than after a cold load. And it answers the
 * question RenderSurface would otherwise answer with a loader: can the
 * website draw pages at all? If it cannot — offline, or before /app-render is
 * published — the builder learns that here, in the background, and opens
 * straight onto the app's own rendering instead of keeping someone waiting.
 *
 * It removes itself once it knows. WKWebView instances share one cache, so
 * what it loaded stays useful after it has gone.
 */
export function RenderWarmup() {
  const [done, setDone] = useState(sessionAvailability !== "unknown");
  const frame = useRef<HTMLIFrameElement | null>(null);

  const settle = useCallback((result: "available" | "unavailable") => {
    // A surface that already heard from the route knows better than this does.
    if (sessionAvailability === "unknown") sessionAvailability = result;
    setDone(true);
  }, []);

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => settle("unavailable"), READY_TIMEOUT_MS);
    if (Platform.OS !== "web") return () => clearTimeout(timer);
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (RENDER_ORIGIN && event.origin !== RENDER_ORIGIN) return;
      if (parse(event.data)?.type === "ready") settle("available");
    };
    window.addEventListener("message", onMessage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [done, settle]);

  if (done) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: "absolute", width: 1, height: 1, opacity: 0, left: -10, top: -10 }}
    >
      {Platform.OS === "web" ? (
        <iframe ref={frame} src={RENDER_URL} title="" aria-hidden style={{ border: 0, width: 1, height: 1 }} />
      ) : (
        <WebView
          source={{ uri: RENDER_URL }}
          onMessage={(event: WebViewMessageEvent): void => {
            if (parse(event.nativeEvent.data)?.type === "ready") settle("available");
          }}
          onError={(): void => settle("unavailable")}
          onHttpError={(): void => settle("unavailable")}
          style={{ width: 1, height: 1 }}
        />
      )}
    </View>
  );
}
