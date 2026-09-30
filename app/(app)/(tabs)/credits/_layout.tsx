import { Stack } from "expo-router";

/**
 * A stack inside the Credits tab.
 *
 * Without it, `credits/buy` is a sibling of `credits/index` rather than a
 * child, and the tab bar grows a stray fifth tab for it.
 */
export default function CreditsLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
