import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { RESUMES_BUCKET, signedResumeUrl, storagePathFromUrl } from "@/features/media/upload";

/**
 * Links tapped on a page the app shows in a web view.
 *
 * Those views never navigate anywhere themselves (RenderSurface, the live
 * page), so a tapped link has to be opened outside them. The builder's
 * preview opened nothing at all: "Download resume", the Contact button and a
 * LinkedIn link were all dropped (2026-10-09).
 */

export type LinkAction =
  /** The page's CV, in the private resumes bucket, opened through a signed link. */
  | { kind: "resume"; path: string }
  /** Mail, phone and text, handed to the app that does them. */
  | { kind: "app"; url: string }
  /** Anything on the web, in the in-app browser. */
  | { kind: "browser"; url: string };

/**
 * Long enough to open, read and save the file; short enough that a link
 * copied out of the viewer soon stops working.
 */
const RESUME_LINK_SECONDS = 300;

export function linkActionFor(url: string): LinkAction | null {
  const target = url.trim();
  if (/^https:\/\//i.test(target)) {
    // The draft carries the stored public-format URL, which 403s; a published
    // page carries one the website already signed, which opens as it is.
    const path = storagePathFromUrl("resume", target);
    if (path) return { kind: "resume", path };
  }
  if (/^(mailto|tel|sms):/i.test(target)) return { kind: "app", url: target };
  if (/^https?:\/\//i.test(target)) return { kind: "browser", url: target };
  // javascript:, data:, file: and other apps' schemes are never opened.
  return null;
}

/** Opens a link tapped on a page. A failure throws a sentence fit for a toast. */
export async function openPageLink(url: string): Promise<void> {
  const action = linkActionFor(url);
  if (!action) return;

  if (action.kind === "browser") {
    await WebBrowser.openBrowserAsync(action.url);
    return;
  }

  if (action.kind === "app") {
    try {
      await Linking.openURL(action.url);
    } catch {
      throw new Error(noAppFor(action.url));
    }
    return;
  }

  let signed: string;
  try {
    signed = await signedResumeUrl(action.path, RESUME_LINK_SECONDS);
  } catch {
    throw new Error("Your CV wouldn't open. Check your connection and try again.");
  }
  await WebBrowser.openBrowserAsync(signed);
}

/** A link to a CV in the resumes bucket, as stored or as the website signed it. */
const RESUME_PATH = new RegExp(`/object/(?:public|sign)/${RESUMES_BUCKET}/`);

export function isResumeUrl(url: string): boolean {
  return /^https:\/\//i.test(url.trim()) && RESUME_PATH.test(url);
}

/**
 * Lets "Download resume" open the CV while editing, injected into the web view
 * before the page loads.
 *
 * While editing, the website's renderer swallows every tap and opens the
 * editor for what was tapped. A CV link has no editor, so the tap did nothing
 * at all (2026-10-09). A listener on the window hears a tap before the
 * renderer's, which listens on the document, so a tap on a CV link is handed
 * to the app here, in edit mode and preview alike, and every other tap is
 * left to the page.
 */
export const RESUME_TAP_SCRIPT = `(function () {
  var resume = new RegExp(${JSON.stringify(RESUME_PATH.source)});
  window.addEventListener("click", function (event) {
    var target = event.target;
    var link = target && target.closest ? target.closest("a[href]") : null;
    if (!link || !resume.test(link.href)) return;
    event.preventDefault();
    event.stopPropagation();
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "link", url: link.href }));
    }
  }, true);
})();
true;`;

function noAppFor(url: string): string {
  if (/^mailto:/i.test(url)) return "There's no mail app set up on this device.";
  if (/^tel:/i.test(url)) return "This device can't make calls.";
  return "This device can't send texts.";
}
