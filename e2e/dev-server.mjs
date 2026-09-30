import { launch } from "./harness.mjs";

/**
 * The dev server, not the export.
 *
 * Every other suite here runs against `expo export`, which is what ships. But
 * `expo start --web` is what anyone working on the app actually looks at, and
 * the two are not the same: the dev server injects its stylesheet into <head>
 * after the page is live, and that timing alone is enough to surface bugs the
 * export never shows.
 *
 * It caught exactly one, which is why this file exists. NativeWind watches
 * <head>, reads its darkMode flag from the stylesheet when it lands, and then
 * calls colorScheme.set() — which throws when that flag is "media", the Tailwind
 * default. Every export sweep was clean while `npm run web` opened on a red
 * "Cannot manually set color scheme" overlay.
 *
 * Run it against an already-running dev server:
 *   npx expo start --web --port 8081
 *   E2E_BASE=http://localhost:8081 node e2e/dev-server.mjs
 */

const BASE = process.env.E2E_BASE ?? "http://localhost:8081";

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

const problems = [];
page.on("pageerror", (e) => problems.push("PAGEERROR " + String(e).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") problems.push("CONSOLE " + m.text().slice(0, 200));
});

await page.goto(BASE + "/", { waitUntil: "networkidle" });
// The dev bundle is slow to settle, and the error this exists for is thrown
// by a MutationObserver some way after first paint.
await page.waitForTimeout(12000);

const text = (await page.evaluate(() => (document.body.innerText || "").trim())).slice(0, 90);
const rendered = text.length > 40;

console.log(`dev server at ${BASE}`);
console.log(`  rendered: ${rendered ? "yes" : "NO — the page is blank"}  ${text.replace(/\n+/g, " | ")}`);
console.log(`  errors:   ${problems.length ? "\n    " + [...new Set(problems)].join("\n    ") : "none"}`);

await browser.close();
if (!rendered || problems.length) process.exit(1);
