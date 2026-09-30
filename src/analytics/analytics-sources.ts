// ─────────────────────────────────────────────────────────────────────────────
// COPIED VERBATIM from the website: src/lib/analytics-sources.ts.
//
// Pure aggregation — no React, no server imports — so the app computes the
// same numbers from the same rows rather than a second implementation that
// could disagree with the website about how many views a page had.
//
// Only the import paths changed (@/lib/ -> @/analytics/). Re-copy the whole
// file when the website changes it.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Where a visit came from, and what got clicked — pure ───────────────────
// No DB, no env, no DOM. Two jobs:
//
//   1. SOURCES. 87% of recorded views have no referrer at all, because a pitch
//      page is shared in a DM, an email or an app rather than linked from a web
//      page — and the site's own Referrer-Policy keeps even same-site hops
//      coarse. So the owner's share buttons stamp the channel onto the URL
//      (?via=whatsapp) and that wins over the referrer when both exist.
//      `friendlySource` runs at DISPLAY time, never at write time, so the
//      thousands of rows already in the table benefit from every mapping added
//      here without a backfill.
//
//   2. LINK TARGETS. Clicks were only tracked for the résumé and the CTAs.
//      `classifyLinkTarget` names the KIND of link instead, so every other link
//      on the page can be counted without editing a single template layout —
//      matching on the href is what makes it layout-agnostic.
//
// PRIVACY: a target is a CATEGORY, never a URL. The page's own mailto: link
// carries the owner's email address, and this table holds no PII by design.
// Spec: agent-os/specs/2026-09-22-2000-analytics-clean-data/

// ── Share channels ──────────────────────────────────────────────────────────

/** The only values accepted for ?via= — validated server-side before storage. */
export const SHARE_CHANNELS = [
  "linkedin",
  "x",
  "facebook",
  "whatsapp",
  "email",
  "copy",
  "qr",
  "share", // the native OS share sheet, where the real destination is unknowable
] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];

const CHANNEL_LABELS: Record<ShareChannel, string> = {
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  email: "Email",
  copy: "Copied link",
  qr: "QR code",
  share: "Shared",
};

/**
 * A `?via=` value from an untrusted URL, or null. Anything not on the
 * allowlist is dropped rather than stored, so the column can never become a
 * dumping ground for arbitrary visitor-supplied strings.
 */
export function normalizeShareSource(raw: unknown): ShareChannel | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase().slice(0, 32);
  return (SHARE_CHANNELS as readonly string[]).includes(v) ? (v as ShareChannel) : null;
}

// ── Referrer hosts ──────────────────────────────────────────────────────────

/**
 * Host (or Android package name) → the name a person would recognise.
 *
 * Android app referrers are real and land here as package names:
 * `new URL("android-app://com.linkedin.android").hostname` is
 * "com.linkedin.android", which the tracker stores verbatim. Left unmapped it
 * shows up in an owner's "top sources" as a raw package string.
 */
const SOURCE_NAMES: Record<string, string> = {
  // LinkedIn — the channel this product is built around.
  "linkedin.com": "LinkedIn",
  "lnkd.in": "LinkedIn",
  "com.linkedin.android": "LinkedIn",
  // X / Twitter.
  "x.com": "X",
  "twitter.com": "X",
  "t.co": "X",
  "com.twitter.android": "X",
  // Meta.
  "facebook.com": "Facebook",
  "fb.me": "Facebook",
  "com.facebook.katana": "Facebook",
  "instagram.com": "Instagram",
  "com.instagram.android": "Instagram",
  "whatsapp.com": "WhatsApp",
  "wa.me": "WhatsApp",
  "com.whatsapp": "WhatsApp",
  // Mail clients.
  "mail.google.com": "Gmail",
  "com.google.android.gm": "Gmail",
  "outlook.com": "Outlook",
  "outlook.live.com": "Outlook",
  "outlook.office.com": "Outlook",
  "outlook.office365.com": "Outlook",
  "mail.yahoo.com": "Yahoo Mail",
  "mail.proton.me": "Proton Mail",
  // Search.
  "google.com": "Google",
  "bing.com": "Bing",
  "duckduckgo.com": "DuckDuckGo",
  "search.yahoo.com": "Yahoo",
  // Messaging and work tools.
  "slack.com": "Slack",
  "teams.microsoft.com": "Microsoft Teams",
  "teams.live.com": "Microsoft Teams",
  "discord.com": "Discord",
  "t.me": "Telegram",
  "telegram.org": "Telegram",
  "org.telegram.messenger": "Telegram",
  "reddit.com": "Reddit",
  "youtube.com": "YouTube",
  "github.com": "GitHub",
  // Hiring.
  "indeed.com": "Indeed",
  "glassdoor.com": "Glassdoor",
  "ziprecruiter.com": "ZipRecruiter",
  "wellfound.com": "Wellfound",
  "handshake.com": "Handshake",
  "joinhandshake.com": "Handshake",
  // The product's own surfaces — a visit from the owner's dashboard or from
  // the Lovable editor preview is not an outside referral, and saying so beats
  // showing a bare hostname.
  "pitchpage.co": "PitchPage",
  "lovable.dev": "Editor preview",
  "lovable.app": "Editor preview",
  "lovableproject.com": "Editor preview",
};

/**
 * The Lovable editor itself. Only people with access to the project can open a
 * page from there, so a visit carrying this referrer is the team checking a
 * page — treated like an owner self-view: not recorded, not notified, and
 * dropped from every personal analytics read so the rows already stored stop
 * counting too (approved 2026-09-28; production had two, one visitor).
 *
 * EXACTLY this host. `lovable.app` and `lovableproject.com` also host
 * thousands of unrelated sites built with Lovable, whose visitors are real.
 */
export const EDITOR_PREVIEW_HOST = "lovable.dev";

export function isEditorPreviewReferrer(host: string | null | undefined): boolean {
  return (host ?? "").trim().toLowerCase() === EDITOR_PREVIEW_HOST;
}

/** Rows minus editor-preview visits — for every personal analytics read. */
export function withoutEditorPreview<T extends { referrer_host?: string | null }>(rows: T[]): T[] {
  return rows.filter((r) => !isEditorPreviewReferrer(r.referrer_host));
}

/** What is shown when there is no referrer and no channel tag at all. */
export const DIRECT_SOURCE = "Direct";

/**
 * A stored `referrer_host` → a recognisable name. Unknown hosts degrade to the
 * bare host with a leading `www.` removed — never to "Other", because
 * "careers.acme.com" is exactly the employer-attribution signal this product
 * exists to surface.
 */
export function friendlyReferrerHost(host: string | null | undefined): string {
  const h = (host ?? "").trim().toLowerCase();
  if (!h) return DIRECT_SOURCE;

  const bare = h.replace(/^www\./, "");
  const exact = SOURCE_NAMES[bare];
  if (exact) return exact;

  // Walk the dot segments so sub-domains and country domains resolve too:
  // uk.linkedin.com → linkedin.com, www.google.co.uk → google.co.uk.
  const parts = bare.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const suffix = parts.slice(i).join(".");
    if (SOURCE_NAMES[suffix]) return SOURCE_NAMES[suffix];
  }
  // google.co.uk / google.de and friends, which are not worth enumerating.
  if (/^google\.[a-z.]{2,6}$/.test(bare)) return "Google";

  return bare;
}

/**
 * The single source label for a visit. An explicit channel tag wins: the owner
 * pressed that share button, which is stronger evidence than a referrer the
 * browser may or may not have sent.
 */
export function friendlySource(input: {
  shareSource?: string | null;
  referrerHost?: string | null;
}): string {
  const channel = normalizeShareSource(input.shareSource);
  if (channel) return CHANNEL_LABELS[channel];
  return friendlyReferrerHost(input.referrerHost);
}

/**
 * Marks an aggregation bucket as a share CHANNEL rather than a referrer host.
 *
 * Aggregations group by a raw token and the UI maps that token to a name
 * exactly once, at render. Keeping the two apart matters: "linkedin" the
 * channel and "linkedin.com" the referrer are different facts, and a friendly
 * name run through the host mapper a second time would be mangled
 * ("LinkedIn" is not a hostname).
 */
export const VIA_PREFIX = "via:";

/** The raw bucket token for one event. Pair with friendlySourceLabel. */
export function sourceBucket(input: {
  shareSource?: string | null;
  referrerHost?: string | null;
}): string {
  const channel = normalizeShareSource(input.shareSource);
  if (channel) return `${VIA_PREFIX}${channel}`;
  return (input.referrerHost ?? "").trim();
}

/**
 * A bucket token → the name shown to an owner. Handles both shapes, so one
 * display component can serve the personal panels (which bucket channels and
 * hosts together) and the business analytics RPC (which returns bare hosts).
 */
export function friendlySourceLabel(token: string | null | undefined): string {
  const t = (token ?? "").trim();
  if (t.startsWith(VIA_PREFIX)) {
    const channel = normalizeShareSource(t.slice(VIA_PREFIX.length));
    return channel ? CHANNEL_LABELS[channel] : DIRECT_SOURCE;
  }
  return friendlyReferrerHost(t);
}

// ── Link targets ────────────────────────────────────────────────────────────

/** Hosts worth naming individually when an unrecognised link is clicked. */
const SOCIAL_HOSTS: Record<string, string> = {
  "linkedin.com": "linkedin",
  "lnkd.in": "linkedin",
  "x.com": "x",
  "twitter.com": "x",
  "github.com": "github",
  "instagram.com": "instagram",
  "facebook.com": "facebook",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "tiktok.com": "tiktok",
  "dribbble.com": "dribbble",
  "behance.net": "behance",
  "medium.com": "medium",
  "substack.com": "substack",
  "threads.net": "threads",
  "bsky.app": "bluesky",
};

/** The page fields a click can be matched against. */
export type LinkTargetSources = {
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  documentUrls?: Array<string | null | undefined>;
  credentialUrls?: Array<string | null | undefined>;
};

function hostOf(href: string): string | null {
  try {
    return new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function sameUrl(a: string, b: string | null | undefined): boolean {
  return Boolean(b) && a === b;
}

/**
 * The CATEGORY of a clicked link, or null when it is not worth recording.
 *
 * The caller classifies résumé and CTA clicks first — those have their own
 * event types and must not be double-counted here.
 *
 * Categories: linkedin · portfolio · document · credential · email · phone ·
 * social:<network> · anchor · website
 */
export function classifyLinkTarget(
  href: string | null | undefined,
  sources: LinkTargetSources = {},
): string | null {
  const raw = (href ?? "").trim();
  if (!raw) return null;

  // Schemes first: a mailto: or tel: never has a useful host.
  if (/^mailto:/i.test(raw)) return "email";
  if (/^tel:/i.test(raw)) return "phone";
  // A same-page jump is navigation within the page, not a click-out. Worth
  // knowing the nav was used; capped at one per pageload by the caller.
  if (raw.startsWith("#")) return "anchor";
  // Anything left that is not http(s) — javascript:, data:, blob: — is not a
  // destination and is deliberately not recorded.
  if (!/^https?:\/\//i.test(raw)) return null;

  // Known page fields win over a host guess, because they say what the link IS
  // rather than where it points.
  if (sameUrl(raw, sources.linkedinUrl)) return "linkedin";
  if (sameUrl(raw, sources.portfolioUrl)) return "portfolio";
  if ((sources.documentUrls ?? []).some((u) => sameUrl(raw, u))) return "document";
  if ((sources.credentialUrls ?? []).some((u) => sameUrl(raw, u))) return "credential";

  const host = hostOf(raw);
  if (!host) return null;

  const social = SOCIAL_HOSTS[host];
  if (social) return social === "linkedin" ? "linkedin" : `social:${social}`;

  for (const [suffix, name] of Object.entries(SOCIAL_HOSTS)) {
    if (host.endsWith("." + suffix)) return name === "linkedin" ? "linkedin" : `social:${name}`;
  }

  return "website";
}
