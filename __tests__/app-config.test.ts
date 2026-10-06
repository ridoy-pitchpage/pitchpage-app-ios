import type { ConfigContext } from "expo/config";
import createConfig from "../app.config";
import { appDark, appLight } from "@/theme/tokens";

jest.mock("expo/virtual/env", () => ({ env: { APP_VARIANT: "development" } }));

it("uses the correct light and dark brand grounds for the native splash", () => {
  const config = createConfig({ config: {} } as ConfigContext);
  const splash = config.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen");
  expect(splash).toEqual(["expo-splash-screen", expect.objectContaining({
    backgroundColor: appLight.background,
    dark: expect.objectContaining({ backgroundColor: appDark.background }),
  })]);
});
