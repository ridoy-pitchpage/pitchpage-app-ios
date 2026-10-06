import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View, useWindowDimensions, type ColorValue } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChartColumnBig, FileText, UserRound, Wallet } from "lucide-react-native";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { GLASS, mix } from "@/theme/tokens";

/**
 * The selected icon sits in a soft capsule, so shape as well as colour
 * identifies the active destination in both appearances.
 */
function TabIcon({
  Icon,
  color,
  focused,
  surface,
}: {
  Icon: typeof FileText;
  // React Navigation types this as ColorValue; lucide wants a string, and the
  // values that actually arrive are the theme's own hex strings.
  color: ColorValue;
  focused: boolean;
  surface: string;
}) {
  const tint = String(color);
  return (
    <View
      style={{
        width: 42,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 15,
        backgroundColor: focused ? mix(surface, tint, 0.12) : "transparent",
      }}
    >
      <Icon
        size={21}
        color={tint}
        strokeWidth={focused ? 2.35 : 1.8}
      />
    </View>
  );
}

/**
 * The tab bar (§5). The website has no tabs — it uses a desktop sidebar and
 * phone pills for Dashboard, Analytics and Credits — so the grouping follows
 * that, with Account added for the settings the App Store requires.
 *
 * Company appears only for company staff and arrives in M8; it is not a hidden
 * tab here because an empty tab is worse than no tab.
 */
export default function TabsLayout() {
  const colors = useColors();
  const { resolved } = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  // Custom labels wrap instead of the navigator's default single-line clip.
  const barHeight = fontScale > 1.4 ? Math.ceil(54 + fontScale * 42) : 74;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelPosition: "below-icon",
        tabBarAllowFontScaling: true,
        tabBarHideOnKeyboard: true,
        tabBarLabel: ({ color, children }) => (
          <Text
            style={{
              color,
              fontFamily: "Manrope_700Bold",
              fontSize: 11,
              textAlign: "center",
              paddingHorizontal: 2,
            }}
          >
            {children}
          </Text>
        ),
        // Keep the floating silhouette, but reserve layout space for the bar.
        // Nested routes and large text no longer need guessed bottom padding.
        tabBarBackground: () => <TabBarGlass scheme={resolved} card={colors.card} />,
        tabBarStyle: {
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: insets.bottom > 0 ? Math.max(insets.bottom - 6, 8) : 10,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 23,
          height: barHeight,
          paddingTop: 7,
          paddingBottom: 7,
        },
        tabBarItemStyle: { minHeight: 44, paddingHorizontal: 2 },
        tabBarIconStyle: { marginBottom: 3 },
      }}
    >
      <Tabs.Screen
        name="pages"
        options={{
          title: "Pages",
          tabBarAccessibilityLabel: "Your pages",
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={FileText} color={color} focused={focused} surface={colors.card} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarAccessibilityLabel: "Page analytics",
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={ChartColumnBig} color={color} focused={focused} surface={colors.card} />,
        }}
      />
      <Tabs.Screen
        name="credits"
        options={{
          title: "Credits",
          tabBarAccessibilityLabel: "Publishing credits",
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Wallet} color={color} focused={focused} surface={colors.card} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarAccessibilityLabel: "Your account and settings",
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={UserRound} color={color} focused={focused} surface={colors.card} />,
        }}
      />
    </Tabs>
  );
}

/**
 * The frosted panel behind the tab bar.
 *
 * BlurView samples what is actually behind it on iOS. On Android and in the
 * web build it degrades to a translucent fill, which is why the card colour
 * is passed in rather than assumed: a fallback painted on the wrong ground
 * is worse than no blur at all.
 */
function TabBarGlass({ scheme, card }: { scheme: "light" | "dark"; card: string }) {
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={GLASS.intensity}
        tint={scheme === "dark" ? "dark" : "light"}
        style={[StyleSheet.absoluteFill, { borderRadius: 23, overflow: "hidden" }]}
      />
    );
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: card, opacity: 0.98, borderRadius: 23 },
      ]}
    />
  );
}
