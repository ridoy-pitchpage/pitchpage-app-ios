/**
 * Photograph every template on the website, so the picker can show the real
 * thing instead of an approximation of it.
 *
 * The app draws thirty families through five archetypes, which cannot tell
 * Corporate from Letterhead; the website draws each one properly at
 * /sample/<id>. This visits each sample, screenshots it, and writes a small
 * WebP into assets/templates. Re-run it when a template changes on the web —
 * nothing here is automatic, because nothing about the website's deploy is.
 *
 *   node scripts/build-template-thumbnails.mjs [id ...]
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const SITE = process.env.SITE_URL ?? "https://pitchpage.co";
const SHOTS = ".design-sources/template-shots";
const OUT = "assets/templates";

// The width the layouts are designed against; a phone-width screenshot would
// show each one's mobile fallback, which is not what is being chosen.
const WIDTH = 1280;
const HEIGHT = 1016; // 960 of template once the sample banner is cropped off

const source = readFileSync("src/page/style-families.ts", "utf8");
const all = [...source.matchAll(/\{ id: "([a-z-]+)", label: "([^"]+)", category:/g)].map((m) => ({
  id: m[1],
  label: m[2],
}));
const wanted = process.argv.slice(2);
const families = wanted.length ? all.filter((f) => wanted.includes(f.id)) : all;

if (!families.length) {
  console.error("No families matched. Known: " + all.map((f) => f.id).join(", "));
  process.exit(1);
}

mkdirSync(SHOTS, { recursive: true });
mkdirSync(OUT, { recursive: true });

// Edge is on every Windows box and is the same engine, so this needs no
// 150 MB browser download. Override with PLAYWRIGHT_CHANNEL if you have Chrome.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge" });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
const done = [];

for (const family of families) {
  const url = `${SITE}/sample/${family.id}`;
  try {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    if (!response || !response.ok()) throw new Error(`HTTP ${response ? response.status() : "?"}`);
    // Fonts and hero imagery land after networkidle often enough to matter.
    await page.waitForTimeout(1200);
    const file = path.join(SHOTS, `${family.id}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    done.push(family.id);
    console.log(`  shot  ${family.id.padEnd(14)} ${family.label}`);
  } catch (error) {
    console.error(`  FAIL  ${family.id.padEnd(14)} ${error.message}`);
  }
}

await browser.close();

if (!done.length) {
  console.error("Nothing was captured.");
  process.exit(1);
}

console.log(`\nConverting ${done.length} to WebP…`);
execFileSync("python", ["scripts/thumbnails-to-webp.py", ...done], { stdio: "inherit" });

execFileSync(process.execPath, ["scripts/write-thumbnail-map.mjs"], { stdio: "inherit" });
