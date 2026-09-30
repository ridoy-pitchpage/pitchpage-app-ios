import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Where screenshots go. Overridable so CI can collect them. */
export const OUT_DIR =
  process.env.E2E_OUT ?? join(dirname(fileURLToPath(import.meta.url)), "..", ".e2e-out");
mkdirSync(OUT_DIR, { recursive: true });

/** The app under test. `npm run e2e` starts it; override to point elsewhere. */
export const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:8099";

/**
 * This container ships Chromium at a fixed path and blocks the download, so
 * an explicit executablePath is used when one is configured and Playwright's
 * own resolution otherwise.
 */
export function launch() {
  const exe = process.env.E2E_CHROMIUM;
  return chromium.launch(exe ? { executablePath: exe } : {});
}
