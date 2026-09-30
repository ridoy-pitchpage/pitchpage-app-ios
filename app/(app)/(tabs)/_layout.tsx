import { Tabs } from "expo-router";
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
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
