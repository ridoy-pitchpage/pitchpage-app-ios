import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";

import { BackButton } from "@/components/BackButton";
import { MotionEntrance } from "@/components/MotionEntrance";
import { H1, Muted } from "@/components/Text";
import { useColors } from "@/theme/ThemeProvider";

const BRAND_MARK = require("../../assets/brand-mark.png");

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
    <View className="gap-6">
      <View className="flex-row items-center justify-between">
        <BackButton onPress={onBack} />
        <View className="flex-1 flex-row items-center justify-center gap-2.5 px-1">
          <Image
            source={BRAND_MARK}
            style={{ width: 32, height: 32, borderRadius: 9 }}
            contentFit="contain"
            accessibilityLabel="PitchPage logo"
          />
          <Text className="shrink font-heading-semi text-[16px] text-foreground">PitchPage</Text>
        </View>
        <View style={{ width: 44 }} accessibilityElementsHidden />
      </View>

      <MotionEntrance>
        <View className="gap-2.5 pb-1">
          <View className="flex-row items-center gap-2.5">
            <View
              style={{ width: 24, height: 3, borderRadius: 2, backgroundColor: colors.link }}
              accessibilityElementsHidden
            />
            <Text
              className="shrink font-body-bold text-[11px] uppercase"
              style={{ color: colors.link, letterSpacing: 1.6 }}
            >
              {eyebrow}
            </Text>
          </View>
          <H1 style={{ fontSize: 30, lineHeight: 38 }}>{title}</H1>
          <Muted style={{ fontSize: 15, lineHeight: 23 }}>{description}</Muted>
        </View>
      </MotionEntrance>
    </View>
  );
}
