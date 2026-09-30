import { contrastRatio, readableAccent, themeForTemplate } from "@/render/template-theme";
import { COLOR_PRESETS, STYLE_FAMILIES, encodeStyleSelection, parseStyleSelection, resolveStyle } from "@/page/style-families";

describe("template themes", () => {
  it("gives every style and colour a readable accent", () => {
    // 30 families x 20 colours x 2 modes. This is the check that matters:
    // a page whose headline cannot be read against its own ground is broken,
    // and nobody would find it by looking at a handful of combinations.
    const failures: string[] = [];

    for (const family of STYLE_FAMILIES) {
      for (const color of COLOR_PRESETS) {
        for (const mode of ["light", "dark"] as const) {
          const theme = themeForTemplate(encodeStyleSelection(family.id, color.id, mode));

          const accentText = contrastRatio(theme.accentText, theme.ground);
          if (accentText < 4.5) {
            failures.push(`${family.id}/${color.id}/${mode} accentText ${accentText.toFixed(2)}`);
          }

          const body = contrastRatio(theme.ink, theme.ground);
          if (body < 7) failures.push(`${family.id}/${mode} ink ${body.toFixed(2)}`);

          const onAccent = contrastRatio(theme.onAccent, theme.accent);
          if (onAccent < 4.5) {
            failures.push(`${family.id}/${color.id} onAccent ${onAccent.toFixed(2)}`);
          }
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it("keeps a nudged accent recognisable rather than jumping to black", () => {
    // Gold that has to darken should still look like gold.
    const gold = "#C9A84C";
    const nudged = readableAccent(gold, "#FFFFFF");
    expect(contrastRatio(nudged, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(nudged).not.toBe("#000000");
  });

  it("leaves an accent alone when it already passes", () => {
    expect(readableAccent("#0D47A1", "#FFFFFF")).toBe("#0D47A1");
  });
});

describe("style keys", () => {
  it("round-trips", () => {
    const key = encodeStyleSelection("console", "cyan", "dark");
    const parsed = parseStyleSelection(key);
    expect(parsed.family?.id).toBe("console");
    expect(parsed.color?.id).toBe("cyan");
    expect(parsed.mode).toBe("dark");
  });

  it("omits the mode segment when none was chosen, as the site does", () => {
    expect(encodeStyleSelection("console", "cyan")).toBe("console__cyan");
  });

  it("falls back rather than guessing at an unknown family", () => {
    // A page on a retired family must keep rendering.
    const parsed = parseStyleSelection("harbor__gold__dark");
    expect(parsed.family).toBeNull();
    expect(resolveStyle("harbor__gold__dark").family.id).toBe("corporate");
  });

  it("honours the one family with a single mode", () => {
    // Skyline is dark only; asking for light must not produce a light page.
    expect(resolveStyle("skyline__yellow__light").mode).toBe("dark");
  });
});
