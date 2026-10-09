import Constants from "expo-constants";

/**
 * Build-time configuration. Nothing secret lives here: the Supabase
 * publishable key is the same one the web app ships to every browser, and the
 * service-role key never leaves the server (master plan §21).
 */
type Extra = {
  variant?: "development" | "preview" | "production";
  site?: string;
  apiUrl?: string;
  renderUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const SITE_URL = extra.site ?? "https://pitchpage.co";

/** The app API in the web repo (master plan §9). */
export const API_URL = extra.apiUrl ?? `${SITE_URL}/api/app/v1`;

/** The render surface that draws pages with the web's own layouts (§14). */
export const RENDER_URL = extra.renderUrl ?? `${SITE_URL}/app-render`;

/**
 * Appended to the user agent of every web view the app embeds, so the website
 * knows a page is showing inside the app and keeps Google Analytics and
 * PostHog out of it (src/lib/ios-app-surface.ts in the web repo). The App
 * Privacy answers say the app collects no analytics; this is what keeps the
 * website's pages inside it to that. react-native-webview adds it after
 * WebKit's own name, so pages still see an ordinary iPhone.
 */
export const WEB_VIEW_AGENT = "PitchPageApp";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://ervsfjyuhtnepigfgskh.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_emvwavho1vArRh4-Lu9RYA_9Ow8PCiy";

export const APP_VARIANT = extra.variant ?? "development";
export const IS_DEV_VARIANT = APP_VARIANT === "development";

/**
 * A throwaway account to sign in with while developing, from .env.
 *
 * The app talks to production and there is no staging backend (master plan
 * §24), so seeing any signed-in screen means a real session. This saves
 * retyping one on every reload; it does not create or bypass anything.
 *
 * Null unless __DEV__ AND both variables are set, so a build that never had
 * them behaves exactly as before. Treat whatever goes in here as public:
 * EXPO_PUBLIC_* values are inlined into the JS bundle at build time, so this
 * is for a test account and nothing else, ever.
 */
const devEmail = process.env.EXPO_PUBLIC_DEV_EMAIL;
const devPassword = process.env.EXPO_PUBLIC_DEV_PASSWORD;

export const DEV_SIGN_IN =
  __DEV__ && devEmail && devPassword ? { email: devEmail, password: devPassword } : null;

export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";

export const SUPPORT_EMAIL = "support@pitchpage.co";

/** Public pages that open in an in-app browser rather than a native screen (§6.2). */
export const WEB_LINKS = {
  privacy: `${SITE_URL}/privacy`,
  terms: `${SITE_URL}/terms`,
  about: `${SITE_URL}/about`,
  compare: `${SITE_URL}/compare`,
  tracking: `${SITE_URL}/tracking`,
  roles: `${SITE_URL}/for`,
} as const;

/** A published page's public URL. Share links always point at the website. */
export function publicPageUrl(slug: string): string {
  return `${SITE_URL}/p/${slug}`;
}
