import { Stack } from "expo-router";

/** A stack inside the Account tab, so its sub-screens nest rather than
 *  becoming tabs of their own. */
export default function AccountLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
