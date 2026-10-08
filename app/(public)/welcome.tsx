import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { ArrowRight } from "lucide-react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { appLight } from "@/theme/tokens";

const PAGE_EXAMPLE = require("../../assets/templates/personal.webp");

export default function Welcome() {
  const colors = useColors();
  const { resolved } = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const compact = (height < 740 || width < 360) && fontScale < 1.3;
  const actionInk = resolved === "dark" ? colors.primaryForeground : appLight.primaryForeground;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text className="font-heading" style={{ flex: 1, fontSize: 18, letterSpacing: -0.9, color: colors.foreground }}>
          PitchPage<Text style={{ color: colors.link }}>.</Text>
        </Text>
        <Pressable onPress={() => router.push("/(public)/sign-in")} accessibilityRole="link" accessibilityLabel="Sign in"
          style={{ minWidth: 54, minHeight: 44, alignItems: "flex-end", justifyContent: "center" }}>
          <Text className="font-body-bold" style={{ fontSize: 15, color: colors.link }}>Sign in</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingTop: compact ? 20 : 28, paddingBottom: compact ? 20 : 28 }}>
        <Animated.View entering={FadeIn.duration(250).reduceMotion(ReduceMotion.System)} style={{ gap: compact ? 22 : 30 }}>
          <View style={{ gap: 14 }}>
            <Text accessibilityRole="header" className="font-heading" style={{ fontSize: compact ? 33 : 38, lineHeight: compact ? 40 : 46, letterSpacing: -1.7, color: colors.foreground }}>
              A page for{"\n"}your next move.
            </Text>
            <Text className="font-body" style={{ fontSize: 16, lineHeight: 24, color: colors.mutedForeground }}>
              Bring your story and work together.{"\n"}Share it in one simple link.
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <Image source={PAGE_EXAMPLE} contentFit="cover" contentPosition="top"
              style={{ width: "100%", aspectRatio: compact ? 1.9 : 1.75, borderRadius: 2, borderWidth: 1, borderColor: colors.border }}
              accessibilityLabel="Example PitchPage for Nina Brooks, a career coach, with her portrait and introduction" />
            <Text className="font-body" style={{ fontSize: 13, color: colors.mutedForeground }}>An example of what you can make.</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4, gap: 8 }}>
        <Pressable onPress={() => router.push("/(public)/sign-up")} accessibilityRole="button" accessibilityLabel="Create my page">
          {/* The look lives on an inner View: on iOS a style function on Pressable is dropped (see eslint.config.js). */}
          {({ pressed }) => (
            <View style={{ minHeight: 56, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 5, backgroundColor: colors.link,
              opacity: pressed ? 0.8 : 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Text className="font-body-bold" style={{ flexShrink: 1, fontSize: 17, color: actionInk }}>Create my page</Text>
              <ArrowRight size={22} color={actionInk} strokeWidth={1.8} />
            </View>
          )}
        </Pressable>
        <Text className="font-body-medium" style={{ fontSize: 13, lineHeight: 19, textAlign: "center", color: colors.mutedForeground }}>
          Free to build · 1 credit to publish
        </Text>
        <Pressable onPress={() => router.push("/(public)/examples")} accessibilityRole="link" accessibilityLabel="See examples"
          style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}>
          <Text className="font-body-medium" style={{ fontSize: 15, color: colors.mutedForeground }}>See examples</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
