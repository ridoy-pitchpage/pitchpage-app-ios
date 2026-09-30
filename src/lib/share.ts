/**
 * Share links and the suggested copy, ported from `src/lib/share-url.ts` and
 * `src/lib/share-links.ts` in the web repo.
 *
 * Hard rule on the copy, carried over unchanged: the suggested text is built
 * only from the person's own name and headline plus the page URL. It never
 * invents a claim, never adds an adjective, and an empty headline degrades to
 * name plus URL with no stray punctuation. No em-dashes.
 */

import { SITE_URL } from "./config";

export type SharePerson = { name?: string | null; headline?: string | null };

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/**
 * Absolute, always-public URL for a published page.
 *
 * Always built from the canonical origin, never from wherever the client
 * happens to be running — a link built from a preview host lands the recipient
 * on a sign-in screen instead of the page.
 */
export function publicPageUrl(slug: string, refSlug?: string): string {
  const base = `${SITE_URL}/p/${slug}`;
  return refSlug ? `${base}?ref=${encodeURIComponent(refSlug)}` : base;
}

export type ShareChannel =
  | "linkedin"
  | "x"
  | "facebook"
  | "whatsapp"
  | "email"
  | "copy"
  | "qr"
  | "share";

/**
 * Stamp the share channel onto a page URL as `?via=`.
 *
 * 87% of recorded views arrive with no referrer at all — a pitch page is shared
 * in a DM, an email or an app, not linked from a web page — so this is the only
 * way to know how someone came to open it. QR codes and copied links have no
 * other trace whatsoever.
 *
 * `?ref=` is untouched, so a tracked link keeps working and carries both.
 * Returns the url unchanged if it cannot be parsed: a share button must never
 * be the thing that breaks.
 */
export function withShareChannel(url: string, channel: ShareChannel): string {
  if (!channel) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("via", channel);
    return parsed.toString();
  } catch {
    return url;
  }
}

/** The suggested sentence. Short enough for X (280) even with the URL. */
export function buildShareText(person: SharePerson, url: string): string {
  const name = clean(person.name);
  const headline = clean(person.headline);
  const who = name || "My pitch page";
  const sentence = headline ? `${who}: ${headline}` : who;
  const budget = Math.max(40, 279 - clean(url).length);
  const trimmed =
    sentence.length <= budget ? sentence : `${sentence.slice(0, budget - 1).trimEnd()}…`;
  return `${trimmed} ${clean(url)}`.trim();
}

export function buildEmailSubject(person: SharePerson): string {
  const name = clean(person.name);
  return name ? `${name}'s pitch page` : "My pitch page";
}

export function buildEmailBody(person: SharePerson, url: string): string {
  const name = clean(person.name);
  const headline = clean(person.headline);
  const intro = headline ? `${name || "My pitch page"}: ${headline}` : name || "My pitch page";
  return `${intro}\n\n${clean(url)}`;
}

/** A `mailto:` with the subject and body already filled in. */
export function mailto(person: SharePerson, url: string): string {
  const subject = encodeURIComponent(buildEmailSubject(person));
  const body = encodeURIComponent(buildEmailBody(person, url));
  return `mailto:?subject=${subject}&body=${body}`;
}

export type ShareNetwork = "linkedin" | "x" | "facebook" | "whatsapp";

/**
 * Plain public share endpoints. No SDK, no API key, no OAuth — nothing posts on
 * anyone's behalf. `text` is only used where the network accepts it; LinkedIn
 * and Facebook take the URL alone.
 */
export function shareUrl(network: ShareNetwork, url: string, text: string): string {
  const u = encodeURIComponent(clean(url));
  const t = encodeURIComponent(clean(text));
  switch (network) {
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${t}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "whatsapp":
      return `https://wa.me/?text=${t}`;
  }
}

/**
 * The tracked-link slug, ported from `makeRefSlug` in the web's analytics-core.
 * The alphabet omits look-alike characters, and the suffix always contains a
 * letter so the value can never be read as a number by a query parser.
 */
const SUFFIX_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function makeRefSlug(label: string, rand: () => number = Math.random): string {
  const base = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += SUFFIX_ALPHABET[Math.floor(rand() * SUFFIX_ALPHABET.length)];
  }
  if (!/[a-z]/.test(suffix)) suffix = `a${suffix.slice(1)}`;

  return base ? `${base}-${suffix}` : `link-${suffix}`;
}
