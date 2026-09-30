import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwind = require("../tailwind.config.js") as {
  theme: { extend: { colors: Record<string, string> } };
};

/**
 * Two things a screenshot shows and nothing else does.
 *
 * A colour class that is not in the config produces NO colour: NativeWind
 * drops it silently, the element keeps whatever it inherited, and the result
 * is only wrong if the inherited colour happens to be wrong. That is how
 * `text-link-foreground` — a token that never existed — put dark brown
 * numerals on a deep blue circle on "How it works" for as long as it did.
 *
 * And a colour passed into one of the Text components has to WIN against the
 * colour that component already sets. On web, Tailwind breaks that tie by the
 * order it emits utilities, which follows the order of tailwind.config.js's
 * colours rather than the order of the classes at the call site, so an
 * override only works if its colour is declared after `foreground`.
 */

const COLORS = Object.keys(tailwind.theme.extend.colors);
const COLOR_SET = new Set(COLORS);
const FOREGROUND_AT = COLORS.indexOf("foreground");

/** Utilities that take a colour, and the built-ins that need no token. */
const COLOR_PREFIX = /\b(?:text|bg|border|fill|stroke)-([a-z][a-z0-9-]*)\b/g;
const BUILT_IN =
  /^(transparent|current|inherit|white|black|left|right|center|justify|top|bottom|solid|dashed|dotted|none|wrap|nowrap|ellipsis|clip|balance|pretty|auto|xs|sm|base|lg|xl|[0-9])/;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/node_modules|\.git|dist|\.expo|__tests__/.test(path)) sourceFiles(path, out);
    } else if (/\.tsx?$/.test(path)) {
      out.push(path);
    }
  }
  return out;
}

const FILES = [...sourceFiles("app"), ...sourceFiles("src")];

it("finds source files to check", () => {
  expect(FILES.length).toBeGreaterThan(20);
});

it("uses no colour class that the Tailwind config does not define", () => {
  const unknown: string[] = [];
  for (const file of FILES) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const match of line.matchAll(COLOR_PREFIX)) {
          const name = match[1];
          if (name == null || COLOR_SET.has(name) || BUILT_IN.test(name)) continue;
          if (/^[tblrxy]$/.test(name)) continue; // border-t and friends
          unknown.push(`${file}:${index + 1} ${match[0]}`);
        }
      });
  }
  expect([...new Set(unknown)]).toEqual([]);
});

it("passes no text colour into a Text component that would lose the tie", () => {
  // Any colour declared before `foreground` in the config loses to the
  // `text-foreground` those components set themselves, so it must not be
  // passed as a class. `style` is the way to override.
  const losers = COLORS.filter((name, index) => index < FOREGROUND_AT).map((n) => `text-${n}`);
  expect(losers).toContain("text-background"); // the case that caught this

  const offenders: string[] = [];
  const call = /<(?:Body|Muted|Label|H1|H2|H3)\b[^>]*className=[^>]*?"([^"]*)"/g;
  for (const file of FILES) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(call)) {
      const classes = (match[1] ?? "").split(/\s+/);
      for (const loser of losers) {
        if (classes.includes(loser)) offenders.push(`${file}: ${loser}`);
      }
    }
  }
  expect([...new Set(offenders)]).toEqual([]);
});
