// @ts-check
/**
 * Carries the app variant into the generated Xcode project.
 *
 * `ios:release` sets APP_VARIANT=production for prebuild, which is where the
 * bundle id and app name come from. But expo-constants runs app.config.ts
 * again inside every Xcode build to embed the manifest, and that run only sees
 * Xcode's environment, where APP_VARIANT is unset, so `extra.variant` came out
 * as "development" in every upload: builds 5 to 8 showed "Version 1.0.0 (dev)"
 * on the Account screen. Xcode exports build settings to script phases as
 * environment variables, so writing the variant prebuild resolved into the app
 * target's build settings makes that second run agree with the first.
 */
const { withXcodeProject } = require("expo/config-plugins");

/**
 * Sets APP_VARIANT on every build configuration of the app target, which are
 * the ones that carry a bundle identifier; the project-level ones don't.
 * @param {Record<string, any>} section the pbxproj XCBuildConfiguration section
 * @param {string} variant
 */
function setVariant(section, variant) {
  for (const key of Object.keys(section)) {
    const entry = section[key];
    if (!entry || typeof entry !== "object" || !entry.buildSettings) continue;
    if (!entry.buildSettings.PRODUCT_BUNDLE_IDENTIFIER) continue;
    entry.buildSettings.APP_VARIANT = variant;
  }
}

/** @type {import("expo/config-plugins").ConfigPlugin} */
const withAppVariant = (config) =>
  withXcodeProject(config, (mod) => {
    const variant = config.extra && config.extra.variant;
    if (typeof variant !== "string" || !variant) {
      throw new Error("with-app-variant: app.config.ts no longer sets extra.variant.");
    }
    setVariant(mod.modResults.pbxXCBuildConfigurationSection(), variant);
    return mod;
  });

module.exports = withAppVariant;
module.exports.setVariant = setVariant;
