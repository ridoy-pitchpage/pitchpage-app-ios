import type { ConfigContext } from "expo/config";
import plugin from "../plugins/with-app-variant";

jest.mock("expo/virtual/env", () => ({ env: { APP_VARIANT: "development" } }));

type Section = Record<string, { isa?: string; buildSettings?: Record<string, string> } | string>;

describe("the variant Xcode builds see", () => {
  it("is written into the app target's build configurations only", () => {
    const section: Section = {
      A1: { isa: "XCBuildConfiguration", buildSettings: { PRODUCT_BUNDLE_IDENTIFIER: "co.pitchpage.app", SDKROOT: "iphoneos" } },
      A1_comment: "Release",
      A2: { isa: "XCBuildConfiguration", buildSettings: { PRODUCT_BUNDLE_IDENTIFIER: "co.pitchpage.app" } },
      P1: { isa: "XCBuildConfiguration", buildSettings: { SDKROOT: "iphoneos" } },
    };
    plugin.setVariant(section, "production");
    expect((section.A1 as { buildSettings: Record<string, string> }).buildSettings.APP_VARIANT).toBe("production");
    expect((section.A2 as { buildSettings: Record<string, string> }).buildSettings.APP_VARIANT).toBe("production");
    expect((section.P1 as { buildSettings: Record<string, string> }).buildSettings).not.toHaveProperty("APP_VARIANT");
  });

  it("comes from the same variant prebuild used for the bundle id", () => {
    jest.isolateModules(() => {
      const previous = process.env.APP_VARIANT;
      process.env.APP_VARIANT = "production";
      try {
        // isolateModules re-evaluates app.config.ts with the variable set; an import would be cached.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const createConfig = (require("../app.config") as { default: (ctx: ConfigContext) => ReturnType<typeof import("../app.config").default> }).default;
        const config = createConfig({ config: {} } as ConfigContext);
        expect(config.extra?.variant).toBe("production");
        expect(config.ios?.bundleIdentifier).toBe("co.pitchpage.app");
        expect(config.plugins).toContain("./plugins/with-app-variant");
      } finally {
        if (previous === undefined) delete process.env.APP_VARIANT;
        else process.env.APP_VARIANT = previous;
      }
    });
  });
});
