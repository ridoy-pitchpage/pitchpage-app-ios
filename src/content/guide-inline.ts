// ─────────────────────────────────────────────────────────────────────────────
// COPIED VERBATIM from the website: src/lib/guide-inline.ts.
// The app renders the same inline syntax, so it parses it with the same
// regex rather than a second one that could drift.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared inline-markdown helpers for guide/role copy ─────────────────────
// The copy registries (guide-pages.ts, role-pages.ts) carry a tiny inline
// syntax: [text](/internal-path), [text](https://external), **bold**, *italic*.
// The /guide/$slug route renders it to markup; JSON-LD and /llms-full.txt need
// the same words as clean plain text. Both live here so they can never drift.

/** Matches an inline link (internal `/path` OR absolute `https://…`), bold, italic. */
export const INLINE_PATTERN =
  /\[([^\]]+)\]\((\/[^)]*|https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/;

/** A fresh global regex — callers must not share `lastIndex`. */
export function inlineRe(): RegExp {
  return new RegExp(INLINE_PATTERN.source, "g");
}

/** True for hrefs that leave the site (rendered with target/rel by callers). */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Plain-text projection: same words, every inline marker removed. Internal and
 * external links are stripped identically — no bracket syntax, no raw URLs.
 */
export function stripInline(text: string): string {
  let out = text;
  // Repeat until stable: link labels can themselves contain bold/italic
  // (e.g. `[**300 applications**](https://…)`), and JSON-LD answer text must
  // carry no markers at all.
  for (let i = 0; i < 5; i++) {
    const next = out.replace(inlineRe(), (_m, link, _href, bold, em) => link ?? bold ?? em ?? "");
    if (next === out) break;
    out = next;
  }
  return out;
}
