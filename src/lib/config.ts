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

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://ervsfjyuhtnepigfgskh.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_emvwavho1vArRh4-Lu9RYA_9Ow8PCiy";

export const APP_VARIANT = extra.variant ?? "development";
export const IS_DEV_VARIANT = APP_VARIANT === "development";

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
