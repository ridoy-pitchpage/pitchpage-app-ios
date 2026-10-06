import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, Check, FileText, Image, Link2, LockKeyhole, Play } from "lucide-react-native";
import Animated, { FadeIn, LinearTransition, ReduceMotion } from "react-native-reanimated";

import { useColors, useTheme } from "@/theme/ThemeProvider";
import { appLight, mix } from "@/theme/tokens";

const MATERIAL = [
  { label: "Resume", detail: "Experience, education, and the work you're proud of.", icon: FileText },
  { label: "Photos", detail: "A face, a project, a moment. Make the story yours.", icon: Image },
  { label: "Video", detail: "Introduce yourself in your own voice.", icon: Play },
] as const;
const STYLES = ["Classic", "Studio", "Editorial"] as const;

/** The same sample page develops across the journey; no unrelated stock imagery. */
export function JourneyPreview({ active, compact = false, condensed = false }: { active: number; compact?: boolean; condensed?: boolean }) {
  const colors = useColors();
  const { resolved } = useTheme();
  const [material, setMaterial] = useState(0);
  const [design, setDesign] = useState(0);
  const [section, setSection] = useState(0);
  const current = MATERIAL[material] ?? MATERIAL[0];
  const MaterialIcon = current.icon;
  const styled = active >= 2;
  const studio = styled && design === 1;
  const editorial = styled && design === 2;
  const paper = studio
    ? appLight.primary
    : editorial
      ? mix(colors.card, colors.accent, resolved === "dark" ? 0.12 : 0.09)
      : colors.card;
  const ink = studio ? appLight.primaryForeground : colors.foreground;
  const secondaryInk = studio ? mix(appLight.primary, appLight.primaryForeground, 0.78) : colors.mutedForeground;
  const accent = studio ? appLight.primaryForeground : editorial ? colors.accent : colors.link;

  return (
    <LinearGradient
      colors={[mix(colors.background, colors.primary, 0.1), mix(colors.background, colors.accent, 0.04)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: condensed ? 20 : 28, padding: condensed ? 10 : compact ? 14 : 20, gap: condensed ? 8 : 14, overflow: "hidden" }}
    >
      {!condensed ? <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="shrink font-body-bold text-[10px]" style={{ letterSpacing: 1.4, color: colors.mutedForeground }}>
          YOUR STORY, TAKING SHAPE
        </Text>
        <View className="rounded-full bg-card px-2 py-1">
          <Text className="font-body-medium text-[10px] text-muted-foreground">Sample page</Text>
        </View>
      </View> : null}

      <Animated.View
        layout={LinearTransition.duration(260).reduceMotion(ReduceMotion.System)}
        style={{ borderRadius: condensed ? 14 : 20, borderWidth: 1, borderColor: colors.border, backgroundColor: paper, padding: condensed ? 12 : 18, gap: condensed ? 8 : 14 }}
      >
        {condensed ? (
          <Text className="font-body-bold text-[11px]" style={{ color: secondaryInk }}>Alex Morgan · Sample page</Text>
        ) : <View className="flex-row items-center gap-3">
          <View style={{ width: 42, height: 42, borderRadius: editorial ? 12 : 21, backgroundColor: mix(paper, accent, 0.12), alignItems: "center", justifyContent: "center" }}>
            <Text className="font-heading-semi text-[15px]" style={{ color: accent }}>AM</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-heading-semi text-[16px]" style={{ color: ink }}>Alex Morgan</Text>
            <Text className="font-body text-[11px]" style={{ color: secondaryInk }}>Product designer · London</Text>
          </View>
          {active === 3 ? <Check size={18} color={accent} /> : <ArrowUpRight size={18} color={accent} />}
        </View>}

        {condensed ? (
          <View style={{ minHeight: 48, justifyContent: "center" }} accessibilityLiveRegion="polite">
            {active === 0 ? (
              <View className="flex-row items-center gap-2">
                <MaterialIcon size={22} color={accent} />
                <Text className="flex-1 font-body-bold text-[13px]" style={{ color: ink }}>
                  {current.label === "Resume" ? "Your resume.pdf" : current.label === "Photos" ? "Your work, in pictures" : "Your video introduction"}
                </Text>
              </View>
            ) : active === 1 ? (
              <Text className="font-body text-[12px]" style={{ color: ink, lineHeight: 18 }}>
                {section === 0 ? "I turn complex ideas into thoughtful experiences." : "From first sketch to launch, I make the details count."}
              </Text>
            ) : (
              <Text className="font-heading text-[21px]" style={{ color: ink, lineHeight: 26 }}>Good design. Real impact.</Text>
            )}
          </View>
        ) : <Animated.View key={active === 0 ? "material" : "story"} entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)} style={{ gap: 12 }}>
          <Text
            className="font-heading"
            style={{ fontSize: compact ? 23 : 26, lineHeight: compact ? 30 : 34, letterSpacing: -0.8, color: ink }}
          >
            {active === 0 ? "A little more you." : "Good design.\nReal impact."}
          </Text>
          {active === 0 ? (
            <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: colors.input, borderRadius: 12, padding: 13, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialIcon size={22} color={colors.link} />
              <View className="flex-1 gap-1">
                <Text className="font-body-bold text-[12px] text-foreground">{current.label === "Resume" ? "Your resume.pdf" : current.label === "Photos" ? "Your work, in pictures" : "Your introduction"}</Text>
                <Text className="font-body text-[11px] text-muted-foreground">{current.detail}</Text>
              </View>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text className="font-body text-[12px]" style={{ color: secondaryInk, lineHeight: 18 }}>
                {section === 0 ? "I turn complex ideas into useful, thoughtful experiences." : "From first sketch to launch, I make the details count."}
              </Text>
              <View className="flex-row gap-2">
                {["Selected work", "My experience"].map((label, index) => (
                  <View key={label} style={{ flex: 1, minHeight: compact ? 40 : 49, padding: 10, borderRadius: editorial ? 6 : 12, backgroundColor: mix(paper, accent, index === 0 ? 0.13 : 0.06), justifyContent: "center" }}>
                    <Text className="font-body-bold text-[11px]" style={{ color: ink }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>}
      </Animated.View>

      {active === 0 ? (
        <View className="gap-2">
          <View className="flex-row gap-2">
            {MATERIAL.map(({ label, icon: Icon }, index) => (
              <Pressable
                key={label}
                onPress={() => setMaterial(index)}
                accessibilityRole="button"
                accessibilityLabel={"Preview " + label.toLowerCase() + " material"}
                accessibilityState={{ selected: index === material }}
                style={{ flex: 1, minHeight: 44, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1, borderColor: index === material ? colors.link : colors.border, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Icon size={15} color={index === material ? colors.link : colors.mutedForeground} />
                <Text className="font-body-bold text-[11px]" style={{ color: colors.foreground, flexShrink: 1 }}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {!condensed ? <View className="flex-row items-center justify-center gap-1.5">
            <LockKeyhole size={12} color={colors.mutedForeground} />
            <Text className="shrink font-body text-[10px] text-muted-foreground">Your source material stays private.</Text>
          </View> : null}
        </View>
      ) : active === 1 ? (
        <View className="flex-row gap-2">
          {["Your introduction", "Your experience"].map((label, index) => (
            <Pressable
              key={label}
              onPress={() => setSection(index)}
              accessibilityRole="button"
              accessibilityLabel={"Preview " + label.toLowerCase()}
              accessibilityState={{ selected: section === index }}
              style={{ flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: section === index ? colors.link : colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", padding: 8 }}
            >
              <Text className="font-body-bold text-[11px] text-center" style={{ color: section === index ? colors.link : colors.mutedForeground }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : active === 2 ? (
        <View className="flex-row gap-2">
          {STYLES.map((label, index) => (
            <Pressable
              key={label}
              onPress={() => setDesign(index)}
              accessibilityRole="button"
              accessibilityLabel={"Preview " + label + " style"}
              accessibilityState={{ selected: design === index }}
              style={{ flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: design === index ? colors.link : colors.border, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 6 }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: index === 0 ? colors.link : index === 1 ? appLight.primary : colors.accent }} />
              <Text className="font-body-bold text-[11px]" style={{ color: colors.foreground, flexShrink: 1 }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ minHeight: 48, borderRadius: 12, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Link2 size={18} color={colors.link} />
          <View className="flex-1">
            <Text className="font-body-bold text-[12px] text-foreground">One memorable link</Text>
            <Text className="font-body text-[10px] text-muted-foreground">Share it. See when it's opened.</Text>
          </View>
          <ArrowUpRight size={18} color={colors.link} />
        </View>
      )}
    </LinearGradient>
  );
}
