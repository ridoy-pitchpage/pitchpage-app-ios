import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TAP, RADIUS } from "@/theme/tokens";

/**
 * Sign in with Apple, in Apple's own button.
 *
 * Not drawn by hand: Apple's review guidelines and Human Interface Guidelines
 * require its mark, wording and proportions, and the system button is the
 * only way to get all three right in every locale. It is black on a light
 * ground and white on a dark one, as Apple asks, and takes the app's corner
 * radius and control height so it sits level with the Google button below it.
 *
 * It only appears where it can work — iOS 13 and later. On the web build and
 * on Android nothing renders, rather than a button that would fail.
 */
export function AppleSignInButton({
  mode,
  busy,
  onPress,
}: {
  mode: "signin" | "signup";
  /** The system button has no loading state, so taps are ignored instead. */
  busy: boolean;
  onPress: () => void;
}) {
  const { resolved } = useTheme();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let live = true;
    void AppleAuthentication.isAvailableAsync().then((ok) => {
      if (live) setAvailable(ok);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!available) return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={
        mode === "signin"
          ? AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
          : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
      }
      buttonStyle={
        resolved === "dark"
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={RADIUS.control}
      style={{ width: "100%", height: MIN_TAP + 8, opacity: busy ? 0.6 : 1 }}
      onPress={() => {
        if (!busy) onPress();
      }}
    />
  );
}
