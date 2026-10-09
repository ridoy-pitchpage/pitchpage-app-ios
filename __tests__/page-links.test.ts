import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { linkActionFor, openPageLink } from "@/render/page-links";

const mockCreateSignedUrl = jest.fn();
jest.mock("@/auth/supabase", () => ({
  supabase: { storage: { from: () => ({ createSignedUrl: mockCreateSignedUrl }) } },
}));
jest.mock("@/features/media/local-file", () => ({ fileBytes: jest.fn() }));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));

/**
 * A link tapped on a page in one of the app's web views opens outside it,
 * because the view itself never navigates. These hold where each kind goes.
 */

const STORAGE = "https://ervsfjyuhtnepigfgskh.supabase.co/storage/v1/object";
const STORED_CV = `${STORAGE}/public/resumes/user-1/page-1-resume-ab12.pdf`;
const SIGNED_CV = `${STORAGE}/sign/resumes/user-1/page-1-resume-ab12.pdf?token=t`;

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

describe("linkActionFor", () => {
  it("signs the CV a draft carries, whose own address is refused", () => {
    expect(linkActionFor(STORED_CV)).toEqual({ kind: "resume", path: "user-1/page-1-resume-ab12.pdf" });
  });

  it("opens a CV the website already signed as it is", () => {
    expect(linkActionFor(SIGNED_CV)).toEqual({ kind: "browser", url: SIGNED_CV });
  });

  it("hands mail, phone and text to the apps that do them", () => {
    for (const url of ["mailto:jane@example.com", "MAILTO:Jane@Example.com", "tel:+15551234567", "sms:+15551234567"]) {
      expect(linkActionFor(url)).toEqual({ kind: "app", url });
    }
  });

  it("opens the web in the in-app browser", () => {
    for (const url of ["https://www.linkedin.com/in/jane", "http://example.com/portfolio"]) {
      expect(linkActionFor(url)).toEqual({ kind: "browser", url });
    }
  });

  it("never opens a script, a data URL, a file or another app", () => {
    for (const url of ["javascript:void(0)", "data:text/html,hello", "file:///private/var/x", "whatsapp://send", "about:blank", ""]) {
      expect(linkActionFor(url)).toBeNull();
    }
  });
});

describe("openPageLink", () => {
  it("opens the CV through a short-lived signed link", async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: SIGNED_CV }, error: null });
    await openPageLink(STORED_CV);
    expect(mockCreateSignedUrl).toHaveBeenCalledWith("user-1/page-1-resume-ab12.pdf", 300);
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(SIGNED_CV);
  });

  it("says so in a sentence when the CV can't be signed", async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: null, error: new Error("Object not found") });
    await expect(openPageLink(STORED_CV)).rejects.toThrow(
      "Your CV wouldn't open. Check your connection and try again.",
    );
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });

  it("hands a mailto: straight to the system", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await openPageLink("mailto:jane@example.com");
    expect(open).toHaveBeenCalledWith("mailto:jane@example.com");
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });

  it("explains a link nothing on the device can open", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("Unable to open URL: mailto:jane@example.com"));
    await expect(openPageLink("mailto:jane@example.com")).rejects.toThrow(
      "There's no mail app set up on this device.",
    );
  });

  it("does nothing with a link it will not open", async () => {
    const open = jest.spyOn(Linking, "openURL");
    await openPageLink("javascript:void(0)");
    expect(open).not.toHaveBeenCalled();
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });
});
