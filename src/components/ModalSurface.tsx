import type { ReactNode } from "react";
import { Platform, View, useWindowDimensions } from "react-native";

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const FRAME_ABOVE = 520;
const FRAME_PADDING = 24;

export function useModalSurfaceDimensions() {
  const window = useWindowDimensions();
  const framed = Platform.OS === "web" && window.width >= FRAME_ABOVE;

  return {
    framed,
    width: framed ? PHONE_WIDTH : window.width,
    height: framed
      ? Math.min(Math.max(window.height - FRAME_PADDING * 2, 0), PHONE_HEIGHT)
      : window.height,
  };
}

/**
 * Keeps React Native Modal content aligned with PhoneFrame on wide web
 * previews. Native modals remain true full-screen iOS/Android surfaces.
 */
export function ModalSurface({ children }: { children: ReactNode }) {
  const surface = useModalSurfaceDimensions();

  if (!surface.framed) return <View className="flex-1">{children}</View>;

  return (
    <View className="flex-1 items-center justify-center">
      <View
        style={{
          width: surface.width,
          height: surface.height,
          overflow: "hidden",
          borderRadius: 28,
        }}
      >
        {children}
      </View>
    </View>
  );
}
