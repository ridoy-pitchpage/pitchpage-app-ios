import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Button } from "@/components/Button";

export function GoogleSignInButton({
  mode,
  loading,
  onPress,
}: {
  mode: "signin" | "signup";
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      title={mode === "signin" ? "Continue with Google" : "Sign up with Google"}
      variant="secondary"
      loading={loading}
      icon={<GoogleMark />}
      onPress={onPress}
    />
  );
}

function GoogleMark() {
  return (
    <View accessibilityElementsHidden>
      <Svg width={19} height={19} viewBox="0 0 24 24">
        <Path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.39Z" />
        <Path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.52c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.03v2.6A10 10 0 0 0 12 22Z" />
        <Path fill="#FBBC05" d="M6.38 13.88A6 6 0 0 1 6.06 12c0-.65.11-1.29.32-1.88v-2.6H3.03A10 10 0 0 0 2 12c0 1.61.39 3.14 1.03 4.48l3.35-2.6Z" />
        <Path fill="#EA4335" d="M12 5.99c1.47 0 2.79.5 3.82 1.5l2.88-2.87A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.97 5.52l3.35 2.6C7.17 7.75 9.39 5.99 12 5.99Z" />
      </Svg>
    </View>
  );
}
