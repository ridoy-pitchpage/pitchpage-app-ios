import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart3, CircleUser, Coins, FileText } from "lucide-react-native";

import { useColors } from "@/theme/ThemeProvider";

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
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
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
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="credits"
        options={{
          title: "Credits",
          tabBarIcon: ({ color, size }) => <Coins size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => <CircleUser size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
