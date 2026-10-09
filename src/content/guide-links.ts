import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";

import type { GuideCtaTo } from "@/content/guide-related";

/**
 * Where a guide's links go in the app.
 *
 * The articles were written for the website, so every href in them is a web
 * path. A path that has a screen here stays inside the app. A path without
 * one is left as plain text rather than opened on the web (2026-10-09): every
 * marketing page on pitchpage.co names the price and links to buying, and an
 * app that sells nothing may not point anyone at a purchase outside it
 * (Guideline 3.1.3(f)). The role landing pages (/for/nurses and its siblings)
 * are most of these. They are for people who have not signed up, and
 * everyone reading here has.
 */

/** Web paths that have a screen here. */
const IN_APP: Record<string, string> = {
  "/examples": "/examples",
  // Neither has a screen of its own. How it works covers building and
  // publishing, and the website's pricing page shows a Buy button.
  "/pricing": "/how-it-works",
  "/features": "/how-it-works",
  "/tracking": "/(app)/(tabs)/account/tracking",
  "/faq": "/faq",
  "/how-it-works": "/how-it-works",
  "/contact": "/contact",
};

export type GuideLinkTarget =
  | { kind: "guide"; slug: string }
  | { kind: "screen"; path: string }
  /** Another website. */
  | { kind: "web"; url: string };

const SITE = /^https?:\/\/(?:www\.)?pitchpage\.co(?=[/?#]|$)/i;

/** Where a `[text](/path)` or `[text](https://…)` link goes, or null to leave it as text. */
export function guideLinkTarget(href: string): GuideLinkTarget | null {
  const trimmed = href.trim();
  // The website by its full address is a site path like any other.
  const path = SITE.test(trimmed) ? trimmed.replace(SITE, "") || "/" : trimmed;
  if (/^https?:\/\//i.test(path)) return { kind: "web", url: path };

  const guide = /^\/guide\/([a-z0-9-]+)\/?$/.exec(path);
  if (guide?.[1]) return { kind: "guide", slug: guide[1] };

  const screen = IN_APP[path.replace(/[?#].*$/, "").replace(/\/$/, "")];
  return screen ? { kind: "screen", path: screen } : null;
}

/** Open a guide link. One with nowhere to go in the app does nothing. */
export function openGuideHref(href: string): void {
  const target = guideLinkTarget(href);
  if (!target) return;

  if (target.kind === "web") {
    void WebBrowser.openBrowserAsync(target.url);
    return;
  }

  if (target.kind === "guide") {
    router.push({
      pathname: "/(app)/(tabs)/account/guides/[slug]",
      params: { slug: target.slug },
    });
    return;
  }

  router.push(target.path as never);
}

/**
 * Where an article's call to action sends a reader.
 *
 * On the website every one of these is aimed at a visitor who has not signed
 * up yet — /auth most of all. In the app the reader is already signed in, so
 * "Build my pitch page" means their own pages, not a sign-up form. A target
 * with no screen here goes to Examples rather than the website, for the
 * reason at the top of this file: a button has to go somewhere.
 */
export function runGuideCta(to: GuideCtaTo): void {
  if (to === "/auth") {
    router.push("/(app)/(tabs)/pages");
    return;
  }
  openGuideHref(guideLinkTarget(to) ? to : "/examples");
}
