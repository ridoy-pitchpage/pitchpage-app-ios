import { Platform, View, useWindowDimensions } from "react-native";
import type { ReactNode } from "react";

/**
 * On the web, keeps the app phone-shaped.
 *
 * `expo start --web` is how this gets looked at day to day, and a browser
 * window is five times wider than the device the app is designed for. Stretched
 * across it the layout is not merely ugly, it is misleading: a card that runs
 * the full width, a tab bar with its items a hand apart, and line lengths no
 * phone would ever produce. Judging the design from that is judging something
 * the app never does.
 *
 * So on a wide web viewport the app is drawn in a 390pt column — the iPhone
 * width every screen here is built against — centred on a neutral backdrop,
 * with the rounded corners and shadow that make it read as a device rather
 * than a broken website.
 *
 * On a phone-sized browser, and on iOS and Android, this renders nothing at
 * all: a plain pass-through, no extra view, no measurement.
 */

/** The width every screen is designed against (master plan §19). */
const PHONE_WIDTH = 390;
/** Below this, the browser window is already about phone-shaped. */
const FRAME_ABOVE = 520;

export function PhoneFrame({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== "web" || width < FRAME_ABOVE) return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        // Deliberately not a theme colour: this is the desk the phone sits on,
        // not part of the app, and it should not change when the app's
        // appearance does.
        backgroundColor: "#1C1C1E",
        padding: 24,
      }}
    >
      <View
        style={{
          width: PHONE_WIDTH,
          flex: 1,
          maxHeight: 844,
          overflow: "hidden",
          borderRadius: 28,
          // A phone's own bezel, so the rounded corners do not look like a
          // clipping accident.
          borderWidth: 1,
          borderColor: "#2E2E31",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        {children}
      </View>
    </View>
  );
}
