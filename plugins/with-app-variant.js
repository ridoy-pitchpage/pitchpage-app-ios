// @ts-check
/**
 * Carries the app variant into the generated Xcode project.
 *
 * `ios:release` sets APP_VARIANT=production for prebuild, which is where the
 * bundle id and app name come from. But expo-constants runs app.config.ts
 * again inside every Xcode build to embed the manifest, as a script phase of
 * the Pods project that only sees the environment Xcode gives it, so
 * `extra.variant` came out as "development" in every upload: builds 5 to 8
 * showed "Version 1.0.0 (dev)" on the Account screen.
 *
 * Those script phases source ios/.xcode.env before anything else
 * (expo-constants/scripts/with-node.sh), so the variant prebuild resolved is
 * exported there. A build setting on the app target does not reach a Pods
 * script phase, which is why this isn't one.
 */
const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const EXPORT_LINE = /^export APP_VARIANT=.*$/m;

/**
 * @param {string} contents ios/.xcode.env as prebuild generated it
 * @param {string} variant
 */
function withVariantExport(contents, variant) {
  const line = `export APP_VARIANT=${variant}`;
  if (EXPORT_LINE.test(contents)) return contents.replace(EXPORT_LINE, line);
  const body = contents === "" || contents.endsWith("\n") ? contents : contents + "\n";
  return (
    body +
    "\n# The variant prebuild resolved (plugins/with-app-variant.js), for the expo-constants\n" +
    "# script phase that re-runs app.config.ts during the build.\n" +
    line +
    "\n"
  );
}

/** @type {import("expo/config-plugins").ConfigPlugin} */
const withAppVariant = (config) =>
  withDangerousMod(config, [
    "ios",
    async (mod) => {
      const variant = config.extra && config.extra.variant;
      if (typeof variant !== "string" || !variant) {
        throw new Error("with-app-variant: app.config.ts no longer sets extra.variant.");
      }
      const file = path.join(mod.modRequest.platformProjectRoot, ".xcode.env");
      const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      fs.writeFileSync(file, withVariantExport(current, variant));
      return mod;
    },
  ]);

module.exports = withAppVariant;
module.exports.withVariantExport = withVariantExport;
