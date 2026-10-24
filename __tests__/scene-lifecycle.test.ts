import { readFileSync } from "fs";
import { join } from "path";
import type { ConfigContext } from "expo/config";
import createConfig from "../app.config";
import plugin from "../plugins/with-scene-lifecycle";

jest.mock("expo/virtual/env", () => ({ env: { APP_VARIANT: "development" } }));

// The AppDelegate Expo 57's template generates (expo-template-bare-minimum
// 57.0.33, identical to the ios/ build 7 was archived from).
const TEMPLATE = `internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

describe("the UIScene life cycle iOS 27 requires", () => {
  it("hands React Native to the scene delegate instead of making a window at launch", () => {
    const out = plugin.adoptSceneDelegate(TEMPLATE);
    expect(out).toContain("class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {");
    expect(out).not.toContain("UIWindow(frame:");
    expect(out).not.toContain("startReactNative");
    // The factory the scene delegate starts React Native with is still created.
    expect(out).toContain("reactNativeFactory = factory");
    expect(out).toContain("return super.application(application, didFinishLaunchingWithOptions: launchOptions)");
  });

  it("is safe to run twice", () => {
    const once = plugin.adoptSceneDelegate(TEMPLATE);
    expect(plugin.adoptSceneDelegate(once)).toBe(once);
  });

  it("refuses an AppDelegate it doesn't recognise rather than skip the change", () => {
    expect(() => plugin.adoptSceneDelegate(TEMPLATE.replace("window = UIWindow", "self.window = UIWindow"))).toThrow(
      /UIScene life cycle/
    );
  });

  it("declares one window scene run by Expo's scene delegate", () => {
    const plist = plugin.withSceneManifest({ CFBundleName: "PitchPage" });
    expect(plist.CFBundleName).toBe("PitchPage");
    expect(plist.UIApplicationSceneManifest).toEqual({
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: "Default Configuration", UISceneDelegateClassName: "EXExpoAppSceneDelegate" },
        ],
      },
    });
  });

  it("names a scene delegate Expo actually ships", () => {
    const source = readFileSync(join(__dirname, "../node_modules/expo/ios/AppDelegates/ExpoAppSceneDelegate.swift"), "utf8");
    expect(source).toContain("@objc(EXExpoAppSceneDelegate)");
  });

  it("runs on every prebuild", () => {
    const config = createConfig({ config: {} } as ConfigContext);
    expect(config.plugins).toContain("./plugins/with-scene-lifecycle");
  });
});
