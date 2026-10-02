import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * App config. Three variants (master plan §24):
 *   development  co.pitchpage.app.dev   sits beside the real app on a device
 *   preview      co.pitchpage.app       TestFlight
 *   production   co.pitchpage.app       App Store
 *
 * APP_VARIANT is set by the EAS build profile; plain `expo start` is development.
 */
type Variant = "development" | "preview" | "production";
const VARIANT = (process.env.APP_VARIANT as Variant) ?? "development";
const IS_DEV = VARIANT === "development";

/** pitchpage.co is the one backend (master plan §24 — there is no staging). */
const SITE = "https://pitchpage.co";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "PitchPage Dev" : "PitchPage",
  slug: "pitchpage",
  scheme: "pitchpage",
  version: "1.0.0",
  orientation: "portrait",
  // The New Architecture is the default in SDK 57, so it is not set here.
  userInterfaceStyle: "automatic",
  // Flat, high-resolution brand artwork with no alpha channel, as iOS requires.
  icon: "./assets/icon-v2.png",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false, // iPhone only for 1.0 (decision Q7)
    bundleIdentifier: IS_DEV ? "co.pitchpage.app.dev" : "co.pitchpage.app",
    associatedDomains: ["applinks:pitchpage.co", "webcredentials:pitchpage.co"],
    config: {
      // Nothing in the app tracks people across other companies' apps or sites,
      // so there is no App Tracking Transparency prompt (master plan §21).
      usesNonExemptEncryption: false,
    },
    /*
     * Apple rejects an upload whose binary calls a "required reason" API without
     * declaring why (ITMS-91053). These four are reached by React Native itself
     * and by the Expo modules this app ships — storage, file system, image
     * picking, timing — so they are declared here for the whole app, each with
     * the reason that matches how it is used:
     *
     *   UserDefaults    CA92.1  read and written only by this app
     *   FileTimestamp   C617.1  files inside the app container
     *                   3B52.1  files the person picked themselves
     *   SystemBootTime  35F9.1  measuring elapsed time, never identity
     *   DiskSpace       E174.1  checking there is room before writing
     *                   85F4.1  so a too-large upload can say so
     *
     * Tracking is false: nothing here follows anyone across other companies'
     * apps or sites, which is also why there is no ATT prompt.
     */
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1", "3B52.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
          NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"],
        },
      ],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        "PitchPage uses your camera so you can take a portrait and record your intro video.",
      NSMicrophoneUsageDescription:
        "PitchPage uses your microphone to record the audio for your intro video.",
      NSPhotoLibraryUsageDescription:
        "PitchPage needs your photo library so you can pick a portrait, project photos and video clips for your page.",
      NSPhotoLibraryAddUsageDescription:
        "PitchPage saves your page's QR code to your photo library.",
      NSSpeechRecognitionUsageDescription:
        "PitchPage uses speech recognition so you can dictate your answers instead of typing.",
    },
  },
  android: {
    package: IS_DEV ? "co.pitchpage.app.dev" : "co.pitchpage.app",
    adaptiveIcon: {
      foregroundImage: "./assets/brand-mark.png",
      backgroundColor: "#F5EBDD",
    },
  },
  web: { bundler: "metro", output: "single", favicon: "./assets/favicon.png" },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        // Cream, the brand ground in both palettes' light mode (§19).
        backgroundColor: "#F5EBDD",
        image: "./assets/brand-mark.png",
        imageWidth: 200,
        dark: { backgroundColor: "#F5EBDD", image: "./assets/brand-mark.png", imageWidth: 200 },
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    variant: VARIANT,
    site: SITE,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? `${SITE}/api/app/v1`,
    renderUrl: process.env.EXPO_PUBLIC_RENDER_URL ?? `${SITE}/app-render`,
    router: {},
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
