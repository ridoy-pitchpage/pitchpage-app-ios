import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";

import { guideLinkTarget, openGuideHref, runGuideCta } from "@/content/guide-links";

jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

/**
 * The guides were written for the website. Their links stay in the app where
 * a screen exists, and are never opened on pitchpage.co, whose marketing pages
 * name the price and link to buying.
 */

beforeEach(() => jest.clearAllMocks());

describe("guideLinkTarget", () => {
  it("keeps the role pages, compare and the homepage as plain text", () => {
    for (const href of ["/for/nurses", "/for", "/compare", "/", "/guides", "https://pitchpage.co/for/nurses", "https://www.pitchpage.co"]) {
      expect(guideLinkTarget(href)).toBeNull();
    }
  });

  it("sends the pages that have a screen here to it", () => {
    expect(guideLinkTarget("/tracking")).toEqual({ kind: "screen", path: "/(app)/(tabs)/account/tracking" });
    expect(guideLinkTarget("/features")).toEqual({ kind: "screen", path: "/how-it-works" });
    expect(guideLinkTarget("/pricing")).toEqual({ kind: "screen", path: "/how-it-works" });
    expect(guideLinkTarget("/examples/")).toEqual({ kind: "screen", path: "/examples" });
    expect(guideLinkTarget("https://pitchpage.co/faq")).toEqual({ kind: "screen", path: "/faq" });
  });

  it("opens another guide in the app, and other websites in the browser", () => {
    expect(guideLinkTarget("/guide/what-is-a-pitch-page")).toEqual({ kind: "guide", slug: "what-is-a-pitch-page" });
    expect(guideLinkTarget("https://www.bls.gov/ooh/")).toEqual({ kind: "web", url: "https://www.bls.gov/ooh/" });
  });
});

describe("opening", () => {
  it("does nothing for a link with nowhere to go in the app", () => {
    openGuideHref("/for/nurses");
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("sends a call to action with no screen to Examples, never the website", () => {
    runGuideCta("/compare");
    expect(router.push).toHaveBeenCalledWith("/examples");
    runGuideCta("/tracking");
    expect(router.push).toHaveBeenLastCalledWith("/(app)/(tabs)/account/tracking");
    runGuideCta("/auth");
    expect(router.push).toHaveBeenLastCalledWith("/(app)/(tabs)/pages");
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });
});
