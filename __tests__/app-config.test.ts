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

it("asks for only the permissions the app uses", () => {
  const config = createConfig({ config: {} } as ConfigContext);
  const options = (name: string) =>
    (config.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === name) as
      | [string, Record<string, unknown>]
      | undefined)?.[1];
  // The session sits in the keychain without biometrics, so no Face ID text.
  expect(options("expo-secure-store")).toEqual({ faceIDPermission: false });
  // The camera takes a portrait and the intro video comes from Photos, so the
  // app never records, and never asks for the microphone.
  const picker = options("expo-image-picker");
  expect(picker).toEqual(expect.objectContaining({ microphonePermission: false }));
  expect(String(picker?.cameraPermission)).not.toMatch(/record|video/i);
  expect(config.ios?.infoPlist).not.toHaveProperty("NSMicrophoneUsageDescription");
});
