import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { Link2, Sparkles } from "lucide-react-native";

import { BackButton } from "@/components/BackButton";
import { H1, Muted } from "@/components/Text";
import { useColors } from "@/theme/ThemeProvider";

const BRAND_MARK = require("../../assets/brand-mark.png");
const AUTH_DESK = require("../../assets/auth-desk.webp");

/** Shared visual introduction for the two account entry points. */
export function AuthIntro({
  eyebrow,
  title,
  description,
  onBack,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  onBack: () => void;
}) {
  const colors = useColors();

  return (
    <View className="gap-5">
      <View className="flex-row items-center justify-between">
        <BackButton onPress={onBack} />
        <View className="flex-row items-center gap-2">
          <Image source={BRAND_MARK} style={{ width: 30, height: 30 }} contentFit="contain" />
          <Text className="font-heading-semi text-[15px] text-foreground">PitchPage</Text>
        </View>
      </View>

      <View className="gap-2">
        <Text
          className="font-body-bold text-[11px] uppercase text-link"
          style={{ letterSpacing: 2.2 }}
        >
          {eyebrow}
        </Text>
        <H1>{title}</H1>
        <Muted className="max-w-[340px] text-[15px] leading-6">{description}</Muted>
      </View>

      <View
        className="h-[164px] overflow-hidden rounded-card border border-border bg-card"
        style={{
          shadowColor: colors.foreground,
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <Image
          source={AUTH_DESK}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          contentPosition="center"
          accessibilityLabel="A creator building a PitchPage at a sunlit desk"
        />
        <View className="absolute bottom-3 left-3 right-3 flex-row gap-2">
          <View className="flex-row items-center gap-1.5 rounded-full bg-card px-3 py-2">
            <Sparkles size={14} color={colors.link} strokeWidth={2.2} />
            <Text className="font-body-bold text-[12px] text-foreground">Stand out</Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full bg-card px-3 py-2">
            <Link2 size={14} color={colors.link} strokeWidth={2.2} />
            <Text className="font-body-bold text-[12px] text-foreground">One simple link</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
