import { Stack } from "expo-router";

/**
 * A stack inside the Pages tab.
 *
 * Without it, `pages/[id]/links` is a sibling of `pages/index` rather than a
 * child, and the tab bar grows a stray fifth tab for it.
 */
export default function PagesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
