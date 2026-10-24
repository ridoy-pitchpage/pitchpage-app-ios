import type { ConfigContext } from "expo/config";
import plugin from "../plugins/with-app-variant";

jest.mock("expo/virtual/env", () => ({ env: { APP_VARIANT: "development" } }));

// ios/.xcode.env as Expo's template generates it.
const TEMPLATE = "# Customize the NODE_BINARY variable here.\nexport NODE_BINARY=$(command -v node)\n";

describe("the variant the Xcode script phases see", () => {
  it("is exported after the template's node line", () => {
    const out = plugin.withVariantExport(TEMPLATE, "production");
    expect(out.startsWith(TEMPLATE)).toBe(true);
    expect(out).toMatch(/\nexport APP_VARIANT=production\n$/);
  });

  it("is replaced, not duplicated, when prebuild runs again", () => {
    const once = plugin.withVariantExport(TEMPLATE, "development");
    const twice = plugin.withVariantExport(once, "production");
    expect(twice.match(/export APP_VARIANT=/g)).toHaveLength(1);
    expect(twice).toContain("export APP_VARIANT=production");
    expect(twice).not.toContain("export APP_VARIANT=development");
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
