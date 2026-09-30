// ─────────────────────────────────────────────────────────────────────────────
// COPIED from the website: src/tests/analytics-sources.test.ts.
//
// The aggregation modules are copied verbatim, so their tests come with them:
// that is what proves the app counts a page the same way the website does,
// rather than merely running the same-looking code. Changes: the vitest import
// is dropped (jest provides these as globals) and @/lib/ becomes @/analytics/.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Source naming and link-target classification ───────────────────────────
// Spec: agent-os/specs/2026-09-22-2000-analytics-clean-data/
import {
  friendlySource,
  friendlyReferrerHost,
  normalizeShareSource,
  classifyLinkTarget,
  SHARE_CHANNELS,
  DIRECT_SOURCE,
  sourceBucket,
  friendlySourceLabel,
} from "@/analytics/analytics-sources";

describe("friendlyReferrerHost", () => {
  it("calls a missing referrer Direct", () => {
    // 87% of real views land here: shared in a DM, an email or an app.
    expect(friendlyReferrerHost(null)).toBe(DIRECT_SOURCE);
    expect(friendlyReferrerHost("")).toBe(DIRECT_SOURCE);
    expect(friendlyReferrerHost("   ")).toBe(DIRECT_SOURCE);
  });

  it("names the hosts actually seen in production", () => {
    expect(friendlyReferrerHost("www.google.com")).toBe("Google");
    expect(friendlyReferrerHost("www.linkedin.com")).toBe("LinkedIn");
    expect(friendlyReferrerHost("pitchpage.co")).toBe("PitchPage");
    expect(friendlyReferrerHost("lovable.dev")).toBe("Editor preview");
  });

  it("resolves an android-app:// package name", () => {
    // document.referrer can be "android-app://com.linkedin.android", which
    // URL parses into that hostname — so it reaches the column verbatim and
    // would otherwise be shown to an owner as a raw package string.
    expect(friendlyReferrerHost("com.linkedin.android")).toBe("LinkedIn");
    expect(friendlyReferrerHost("com.google.android.gm")).toBe("Gmail");
    expect(friendlyReferrerHost("com.whatsapp")).toBe("WhatsApp");
    expect(friendlyReferrerHost("org.telegram.messenger")).toBe("Telegram");
  });

  it("resolves subdomains and country domains", () => {
    expect(friendlyReferrerHost("uk.linkedin.com")).toBe("LinkedIn");
    expect(friendlyReferrerHost("l.facebook.com")).toBe("Facebook");
    expect(friendlyReferrerHost("lm.facebook.com")).toBe("Facebook");
    expect(friendlyReferrerHost("web.whatsapp.com")).toBe("WhatsApp");
    expect(friendlyReferrerHost("google.co.uk")).toBe("Google");
    expect(friendlyReferrerHost("www.google.de")).toBe("Google");
  });

  it("is case- and www-insensitive", () => {
    expect(friendlyReferrerHost("WWW.LinkedIn.COM")).toBe("LinkedIn");
  });

  it("keeps an unknown host rather than burying it in 'Other'", () => {
    // "careers.acme.com" is the employer-attribution signal the whole feature
    // exists for — it must survive.
    expect(friendlyReferrerHost("careers.acme.com")).toBe("careers.acme.com");
    expect(friendlyReferrerHost("www.acme.com")).toBe("acme.com");
  });
});

describe("normalizeShareSource", () => {
  it("accepts every allowlisted channel", () => {
    for (const c of SHARE_CHANNELS) expect(normalizeShareSource(c)).toBe(c);
  });

  it("is case-insensitive and trims", () => {
    expect(normalizeShareSource("  LinkedIn ")).toBe("linkedin");
  });

  it("drops anything not on the allowlist", () => {
    // The value arrives from a visitor-controlled URL, so the column must
    // never become a dumping ground.
    expect(normalizeShareSource("evil")).toBeNull();
    expect(normalizeShareSource("<script>")).toBeNull();
    expect(normalizeShareSource("x".repeat(500))).toBeNull();
    expect(normalizeShareSource(null)).toBeNull();
    expect(normalizeShareSource(undefined)).toBeNull();
    expect(normalizeShareSource(42)).toBeNull();
  });
});

describe("friendlySource — via beats referrer", () => {
  it("prefers the channel tag when both are present", () => {
    // The owner pressed that button; the referrer is whatever the browser felt
    // like sending.
    expect(friendlySource({ shareSource: "whatsapp", referrerHost: "www.google.com" })).toBe(
      "WhatsApp",
    );
  });

  it("falls back to the referrer when there is no tag", () => {
    expect(friendlySource({ referrerHost: "www.linkedin.com" })).toBe("LinkedIn");
  });

  it("falls back to the referrer when the tag is junk", () => {
    expect(friendlySource({ shareSource: "nonsense", referrerHost: "www.google.com" })).toBe(
      "Google",
    );
  });

  it("is Direct when there is neither", () => {
    expect(friendlySource({})).toBe(DIRECT_SOURCE);
  });

  it("names the channels a person would recognise", () => {
    expect(friendlySource({ shareSource: "qr" })).toBe("QR code");
    expect(friendlySource({ shareSource: "copy" })).toBe("Copied link");
    expect(friendlySource({ shareSource: "x" })).toBe("X");
  });
});

describe("classifyLinkTarget", () => {
  const sources = {
    linkedinUrl: "https://www.linkedin.com/in/someone",
    portfolioUrl: "https://portfolio.example.com/work",
    documentUrls: ["https://files.example.com/transcript.pdf"],
    credentialUrls: ["https://credly.com/badges/abc"],
  };

  it("matches the page's own fields first", () => {
    expect(classifyLinkTarget(sources.linkedinUrl, sources)).toBe("linkedin");
    expect(classifyLinkTarget(sources.portfolioUrl, sources)).toBe("portfolio");
    expect(classifyLinkTarget(sources.documentUrls[0], sources)).toBe("document");
    expect(classifyLinkTarget(sources.credentialUrls[0], sources)).toBe("credential");
  });

  it("classifies contact schemes", () => {
    expect(classifyLinkTarget("mailto:someone@example.com")).toBe("email");
    expect(classifyLinkTarget("MAILTO:Someone@Example.com")).toBe("email");
    expect(classifyLinkTarget("tel:+15551234567")).toBe("phone");
  });

  it("classifies in-page section links as anchors", () => {
    expect(classifyLinkTarget("#video")).toBe("anchor");
    expect(classifyLinkTarget("#final-cta")).toBe("anchor");
  });

  it("names known social destinations", () => {
    expect(classifyLinkTarget("https://github.com/someone")).toBe("social:github");
    expect(classifyLinkTarget("https://x.com/someone")).toBe("social:x");
    expect(classifyLinkTarget("https://twitter.com/someone")).toBe("social:x");
    expect(classifyLinkTarget("https://www.youtube.com/@someone")).toBe("social:youtube");
    expect(classifyLinkTarget("https://dribbble.com/someone")).toBe("social:dribbble");
  });

  it("calls any LinkedIn link linkedin, matched or not", () => {
    expect(classifyLinkTarget("https://www.linkedin.com/in/other-person")).toBe("linkedin");
    expect(classifyLinkTarget("https://lnkd.in/abc")).toBe("linkedin");
  });

  it("falls back to website for an ordinary external link", () => {
    expect(classifyLinkTarget("https://acme.com/careers")).toBe("website");
  });

  it("records nothing for a non-destination scheme", () => {
    // javascript:/data:/blob: are not places a visitor went.
    expect(classifyLinkTarget("javascript:void(0)")).toBeNull();
    expect(classifyLinkTarget("data:text/html,hi")).toBeNull();
    expect(classifyLinkTarget("blob:https://x/y")).toBeNull();
    expect(classifyLinkTarget("")).toBeNull();
    expect(classifyLinkTarget(null)).toBeNull();
    expect(classifyLinkTarget(undefined)).toBeNull();
  });

  it("NEVER returns anything containing a URL or an address", () => {
    // The table holds no PII by design, and the page's own mailto: carries the
    // owner's email.
    const probes = [
      "mailto:private.person@example.com",
      "tel:+15551234567",
      "https://acme.com/secret-path?token=abc",
      sources.documentUrls[0],
      "https://github.com/someone",
    ];
    for (const p of probes) {
      const t = classifyLinkTarget(p, sources);
      if (t === null) continue;
      expect(t).not.toContain("://");
      expect(t).not.toContain("@");
      expect(t).not.toContain("example.com");
      expect(t).not.toContain("acme");
      expect(t.length).toBeLessThanOrEqual(40); // the target column's CHECK
    }
  });
});

describe("sourceBucket / friendlySourceLabel — raw in, named once at render", () => {
  it("round-trips a channel through the bucket token", () => {
    const token = sourceBucket({ shareSource: "whatsapp", referrerHost: "www.google.com" });
    expect(token).toBe("via:whatsapp");
    expect(friendlySourceLabel(token)).toBe("WhatsApp");
  });

  it("falls back to the referrer host when there is no channel", () => {
    const token = sourceBucket({ referrerHost: "www.linkedin.com" });
    expect(token).toBe("www.linkedin.com");
    expect(friendlySourceLabel(token)).toBe("LinkedIn");
  });

  it("buckets traffic with neither as the empty token, read as Direct", () => {
    expect(sourceBucket({})).toBe("");
    expect(friendlySourceLabel("")).toBe(DIRECT_SOURCE);
    expect(friendlySourceLabel(null)).toBe(DIRECT_SOURCE);
  });

  it("keeps a channel and a host of the same brand in SEPARATE buckets", () => {
    // "shared via LinkedIn" and "arrived from linkedin.com" are different
    // facts, even though they render with the same word.
    expect(sourceBucket({ shareSource: "linkedin" })).not.toBe(
      sourceBucket({ referrerHost: "linkedin.com" }),
    );
  });

  it("ignores a junk via token rather than inventing a source", () => {
    expect(friendlySourceLabel("via:not-a-channel")).toBe(DIRECT_SOURCE);
  });

  it("is NOT applied twice — a label is never fed back through the mapper", () => {
    // friendlyReferrerHost lowercases, so re-mapping "LinkedIn" would yield
    // "linkedin". The contract is: bucket raw, name exactly once.
    expect(friendlySourceLabel(sourceBucket({ shareSource: "linkedin" }))).toBe("LinkedIn");
    expect(friendlyReferrerHost("LinkedIn")).toBe("linkedin");
  });
});
