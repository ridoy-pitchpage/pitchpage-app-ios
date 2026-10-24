// @ts-check
/**
 * Moves the generated iOS project onto the UIScene life cycle.
 *
 * iOS 27 stops any app built with its SDK at launch unless the app adopts
 * scenes: UIKit traps in _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycle-
 * Adoption before a line of JavaScript runs. That is the crash App Review sent
 * back for build 7. Expo 57 ships the scene delegate this needs
 * (EXExpoAppSceneDelegate), but its project template still starts React Native
 * from the app delegate, so every `prebuild --clean` would bring the crash back.
 * Hence a plugin rather than an edit to ios/, which is generated.
 *
 *   AppDelegate.swift  still creates the React Native factory, but no longer
 *                      makes the window; it hands the factory to the scene
 *                      delegate through ExpoReactNativeFactoryProvider.
 *   Info.plist         declares one window scene, run by EXExpoAppSceneDelegate,
 *                      which makes the window, starts React Native, and passes
 *                      links and life-cycle events back to the app delegate, so
 *                      the Linking overrides in AppDelegate keep working.
 *
 * It throws instead of skipping when the template has changed shape, so a
 * release can't quietly go out without the scene life cycle again.
 */
const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

const SCENE_DELEGATE = "EXExpoAppSceneDelegate";

const CLASS_LINE = "class AppDelegate: ExpoAppDelegate {";
const PROVIDER_LINE = "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {";
// The template's own window: created in didFinishLaunching and handed straight
// to React Native. Under scenes the scene delegate does both.
const TEMPLATE_WINDOW =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n[ \t]*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n[ \t]*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

/** @param {string} contents AppDelegate.swift as the template generated it */
function adoptSceneDelegate(contents) {
  if (contents.includes(PROVIDER_LINE)) return contents;
  if (!contents.includes(CLASS_LINE) || !TEMPLATE_WINDOW.test(contents)) {
    throw new Error(
      "with-scene-lifecycle: AppDelegate.swift no longer matches the Expo 57 template, so the " +
        "UIScene life cycle iOS 27 requires was not applied. Update plugins/with-scene-lifecycle.js."
    );
  }
  return contents
    .replace(CLASS_LINE, PROVIDER_LINE)
    .replace(
      TEMPLATE_WINDOW,
      "\n    // The window and React Native start in EXExpoAppSceneDelegate (see Info.plist), which\n" +
        "    // reads the factory above: iOS 27 requires the UIScene life cycle.\n"
    );
}

/**
 * @param {Record<string, unknown>} infoPlist
 * @returns {Record<string, unknown>}
 */
function withSceneManifest(infoPlist) {
  return {
    ...infoPlist,
    UIApplicationSceneManifest: {
      // iPhone only, one window: no second scene for UIKit to open.
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: "Default Configuration", UISceneDelegateClassName: SCENE_DELEGATE },
        ],
      },
    },
  };
}

/** @type {import("expo/config-plugins").ConfigPlugin} */
const withSceneLifecycle = (config) => {
  config = withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== "swift") {
      throw new Error("with-scene-lifecycle: expected the Swift AppDelegate the Expo 57 template generates.");
    }
    mod.modResults.contents = adoptSceneDelegate(mod.modResults.contents);
    return mod;
  });
  return withInfoPlist(config, (mod) => {
    mod.modResults = /** @type {typeof mod.modResults} */ (withSceneManifest(mod.modResults));
    return mod;
  });
};

module.exports = withSceneLifecycle;
module.exports.adoptSceneDelegate = adoptSceneDelegate;
module.exports.withSceneManifest = withSceneManifest;
