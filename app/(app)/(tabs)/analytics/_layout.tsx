import { Stack } from "expo-router";

/**
 * A stack inside the Analytics tab.
 *
 * Without it, `analytics/[id]` is a sibling of `analytics/index` rather than a
 * child, and the tab bar grows a stray fifth tab for it.
 */
export default function AnalyticsLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
