import { Stack } from "expo-router";

import { SiteSurface } from "@/theme/ThemeProvider";

/**
 * Signed-out screens wear the marketing palette, which has no dark mode — the
 * web gives marketing pages no toggle, and someone arriving from the website
 * should meet the surface they just left (§19).
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
