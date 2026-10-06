import { Stack } from "expo-router";

import { SiteSurface } from "@/theme/ThemeProvider";

/**
 * Signed-out screens use the marketing palette in light appearance and the
 * app's accessible navy palette in dark appearance.
 */
export default function PublicLayout() {
  return (
    <SiteSurface>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </SiteSurface>
  );
}
