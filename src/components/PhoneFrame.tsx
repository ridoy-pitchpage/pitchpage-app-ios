import { Platform, View, useWindowDimensions } from "react-native";
import { useMemo, type ReactNode } from "react";
import { SafeAreaFrameContext, SafeAreaInsetsContext } from "react-native-safe-area-context";

/** One illustrative iPhone profile for the desktop preview, never native padding. */
const PHONE = { width: 393, height: 852, topInset: 59, bottomInset: 34 } as const;
const PREVIEW_INSETS = { top: PHONE.topInset, bottom: PHONE.bottomInset, left: 0, right: 0 };
const FRAME_ABOVE = 520;
const FRAME_MARGIN = 24;

/**
 * Desktop browsers have no camera cutout, so their real safe-area insets are
 * zero. Override the preview's context rather than adding padding to the
 * frame: screens and navigation must consume the same insets as on iOS.
 * Phones and native apps continue to use the operating system's real insets.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const frame = useMemo(() => ({
    x: 0,
    y: 0,
    width: PHONE.width - 2,
    height: Math.max(0, Math.min(PHONE.height, height - FRAME_MARGIN * 2) - 2),
  }), [height]);

  if (Platform.OS !== "web" || width < FRAME_ABOVE) return <>{children}</>;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1C1C1E", padding: FRAME_MARGIN }}>
      <View testID="iphone-preview" style={{ width: PHONE.width, flex: 1, maxHeight: PHONE.height, overflow: "hidden", borderRadius: 40,
        borderWidth: 1, borderColor: "#2E2E31", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={PREVIEW_INSETS}>
            {children}
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      </View>
    </View>
  );
}
