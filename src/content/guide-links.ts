import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";

import { SITE_URL } from "@/lib/config";
import type { GuideCtaTo } from "@/content/guide-related";

/**
 * Where a guide's links go in the app.
 *
 * The articles were written for the website, so every href in them is a web
 * path. Some of those paths have a screen here and some do not, and the
 * difference matters: a link that has a screen should stay inside the app,
 * and one that does not should open the real page rather than silently do
 * nothing or land on a stub.
 *
 * The role landing pages (/for/nurses and its siblings) are the largest group
 * with no app screen. They are marketing pages for people who have not signed
 * up, and everyone reading this is signed in, so they open on the web.
 */

/** Web paths that have a screen here. */
const IN_APP: Record<string, string> = {
  "/examples": "/examples",
  // The app has no pricing screen, and must never open the website's: it
  // shows the price and a Buy button, which no storefront without In-App
  // Purchase allows (Guideline 3.1.1). How it works covers publishing.
  "/pricing": "/how-it-works",
  "/faq": "/faq",
  "/how-it-works": "/how-it-works",
  "/contact": "/contact",
};

/** Open a `[text](/path)` or `[text](https://…)` link from guide copy. */
export function openGuideHref(href: string): void {
  if (/^https?:\/\//i.test(href)) {
    void WebBrowser.openBrowserAsync(href);
    return;
  }

  const guide = /^\/guide\/([a-z0-9-]+)\/?$/.exec(href);
  if (guide?.[1]) {
    router.push({
      pathname: "/(app)/(tabs)/account/guides/[slug]",
      params: { slug: guide[1] },
    });
    return;
  }

  const internal = IN_APP[href.replace(/\/$/, "")];
  if (internal) {
    router.push(internal as never);
    return;
  }

  void WebBrowser.openBrowserAsync(`${SITE_URL}${href}`);
}

/**
 * Where an article's call to action sends a reader.
 *
 * On the website every one of these is aimed at a visitor who has not signed
 * up yet — /auth most of all. In the app the reader is already signed in, so
 * "Build my pitch page" means their own pages, not a sign-up form. The rest
 * either have a screen or open on the web, same as any other link.
 */
export function runGuideCta(to: GuideCtaTo): void {
  if (to === "/auth") {
    router.push("/(app)/(tabs)/pages");
    return;
  }
  openGuideHref(to);
}
