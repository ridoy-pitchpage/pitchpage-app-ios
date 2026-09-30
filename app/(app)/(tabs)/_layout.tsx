import { Tabs } from "expo-router";
import { Platform, StyleSheet, View, type ColorValue } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChartColumnBig, FileText, UserRound, Wallet } from "lucide-react-native";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { GLASS } from "@/theme/tokens";

/**
 * A tab's icon: outlined when you are not on it, solid when you are.
 *
 * Every icon being the same hairline outline whatever was selected is what
 * made the bar look flat and dated — the only thing separating the current tab
 * from the rest was its colour, which is also the weakest signal for anyone
 * who does not see colour well. Filling the current one is what iOS itself
 * does, and it carries the selection on shape as well as on colour.
 *
 * The stroke is a little heavier than lucide's default, which is drawn for
 * 24px on a desktop and reads thin at tab size on a phone screen.
 */
function TabIcon({
  Icon,
  color,
  focused,
}: {
  Icon: typeof FileText;
  // React Navigation types this as ColorValue; lucide wants a string, and the
  // values that actually arrive are the theme's own hex strings.
  color: ColorValue;
  focused: boolean;
}) {
  const tint = String(color);
  return (
    <Icon
      size={24}
      color={tint}
      strokeWidth={focused ? 2.4 : 2}
      // A fill at low opacity rather than the full colour: solid enough to
      // read as selected, not so solid the glyph turns into a blob.
      fill={focused ? tint : "transparent"}
      fillOpacity={focused ? 0.18 : 0}
    />
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        // The bar floats over the page rather than sitting under it, so a
        // list scrolls beneath frosted glass instead of stopping at a solid
        // slab. react-navigation still owns the height, so the blur goes in
        // as a background rather than replacing the bar.
        tabBarBackground: () => <TabBarGlass scheme={resolved} card={colors.card} />,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopColor: colors.border,
          /*
           * Explicit, because the icon and its label together need more room
           * than the default.
           *
           * Where there is a home-indicator inset — every modern iPhone — that
           * inset does the padding and 56 above it is the standard bar. Where
           * there is none, which is the web preview and older Android, 56 left
           * the label's own box squeezed to five pixels with overflow hidden,
           * so every label rendered as a sliver of its top edge. 68 gives the
           * 24pt icon and the 11pt label the room they actually need.
           */
          height: insets.bottom > 0 ? 56 + insets.bottom : 68,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        },
        tabBarLabelStyle: { fontFamily: "Manrope_500Medium", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="pages"
        options={{
          title: "Pages",
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={FileText} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={ChartColumnBig} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="credits"
        options={{
          title: "Credits",
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Wallet} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={UserRound} color={color} focused={focused} />,
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
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: card, opacity: 0.96 }]} />;
}
