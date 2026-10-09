import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";

import { BlockDots } from "@/components/BlockLoader";
import { OnboardingShowcase } from "@/onboarding/OnboardingShowcase";
import { completeOnboarding } from "@/onboarding/storage";
import { useColors, useTheme } from "@/theme/ThemeProvider";
import { appLight, mix } from "@/theme/tokens";

const STEPS = [
  {
    label: "The idea", title: "You have\nmore to show.",
    body: "A job, a client, your next opportunity. Put your story and your work in one page people can explore.",
    action: "Show me how", note: "A page for whatever comes next.",
  },
  {
    label: "Your story", title: "Show the work.\nAdd the person.",
    body: "Bring a resume, projects, and a short intro video. Choose the sections that help your pitch.",
    action: "Find my look", note: "Your original files stay private.",
  },
  {
    label: "Your look", title: "A page with\nyour name on it.",
    body: "Choose a design that suits your work. Try 30 layouts and 20+ colour sets before you publish.",
    action: "See how to share", note: "Every design is free to try.",
  },
  {
    label: "Your next move", title: "Send a link.\nMake a connection.",
    body: "Publish your page, send your link or QR code, and see when people visit. Simple as that.",
    action: "Create my page", note: "Build for free. One credit to publish.",
  },
] as const;

export default function Onboarding() {
  const colors = useColors();
  const { resolved } = useTheme();
  const { height, width, fontScale } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const finishingRef = useRef(false);
  const [active, setActive] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const step = STEPS[active] ?? STEPS[0];
  const compact = height < 740 && fontScale < 1.3;
  const smallType = compact || width < 360;
  const blueCover = active === 2;
  const background = blueCover ? appLight.primary : active === 1 ? colors.card : colors.background;
  const ink = blueCover ? appLight.primaryForeground : colors.foreground;
  const mutedInk = blueCover ? mix(appLight.primary, appLight.primaryForeground, 0.78) : colors.mutedForeground;
  const rule = blueCover ? mix(appLight.primary, appLight.primaryForeground, 0.32) : colors.border;
  const actionFill = blueCover ? appLight.card : colors.link;
  const actionInk = blueCover ? appLight.primary : resolved === "dark" ? colors.primaryForeground : appLight.primaryForeground;

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [active]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 22 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderRelease: (_, gesture) => {
      if (finishing) return;
      if (gesture.dx < -60) setActive((current) => Math.min(current + 1, STEPS.length - 1));
      if (gesture.dx > 60) setActive((current) => Math.max(current - 1, 0));
    },
  }), [finishing]);

  async function finish(path: "/(public)/welcome" | "/(public)/sign-in" | "/(public)/sign-up") {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    try { await completeOnboarding(); } catch { /* Storage must never block entry. */ }
    router.replace(path);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
      <StatusBar style={blueCover || resolved === "dark" ? "light" : "dark"} />
      <View style={{ marginHorizontal: 24, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: rule, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text className="font-heading" style={{ fontSize: 18, letterSpacing: -0.9, flex: 1, color: ink }}>PitchPage<Text style={{ color: blueCover ? ink : colors.link }}>.</Text></Text>
        <Pressable onPress={() => void finish("/(public)/sign-in")} disabled={finishing} accessibilityRole="link" accessibilityLabel="Sign in"
          style={{ minWidth: 54, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Text className="font-body-bold" style={{ fontSize: 15, color: ink }}>Sign in</Text>
        </Pressable>
        <Pressable onPress={() => void finish("/(public)/welcome")} disabled={finishing} accessibilityRole="link" accessibilityLabel="Skip introduction"
          style={{ minWidth: 44, minHeight: 44, alignItems: "flex-end", justifyContent: "center" }}>
          <Text className="font-body" style={{ fontSize: 15, color: mutedInk }}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: compact ? 16 : 24, paddingBottom: 20 }}>
        <Animated.View key={active} entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)} {...pan.panHandlers}
          style={{ flexGrow: 1, gap: compact ? 18 : 24 }}>
          <View style={{ gap: compact ? 12 : 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text className="font-body-bold" style={{ fontSize: 13, letterSpacing: 1.2, color: mutedInk }}>{String(active + 1).padStart(2, "0")}</Text>
              <View style={{ width: 22, height: 1, backgroundColor: rule }} />
              <Text className="font-body-medium" style={{ fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase", color: mutedInk }}>{step.label}</Text>
            </View>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" className="font-heading"
              style={{ fontSize: smallType ? 33 : 38, lineHeight: smallType ? 40 : 46, letterSpacing: -1.7, color: ink }}>{step.title}</Text>
            <Text className="font-body" style={{ maxWidth: 380, fontSize: 16, lineHeight: 24, color: mutedInk }}>{step.body}</Text>
          </View>
          <OnboardingShowcase active={active} compact={compact} ink={ink} mutedInk={mutedInk} rule={rule} />
        </Animated.View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4, gap: 8 }}>
        <Text className="font-body-medium" style={{ fontSize: 13, textAlign: "center", lineHeight: 19, color: mutedInk }}>{step.note}</Text>
        <Pressable onPress={() => active === 3 ? void finish("/(public)/sign-up") : setActive((current) => Math.min(current + 1, STEPS.length - 1))}
          disabled={finishing} accessibilityRole="button" accessibilityLabel={step.action} accessibilityState={{ disabled: finishing, busy: finishing }}>
          {/* The look lives on an inner View: on iOS a style function on Pressable is dropped (see eslint.config.js). */}
          {({ pressed }) => (
            <View style={{ minHeight: 56, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 5, backgroundColor: actionFill,
              opacity: pressed || finishing ? 0.75 : 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              {finishing ? <BlockDots color={actionInk} /> : <>
                <Text className="font-body-bold" style={{ flexShrink: 1, fontSize: 17, color: actionInk }}>{step.action}</Text>
                <ArrowRight size={22} color={actionInk} strokeWidth={1.8} />
              </>}
            </View>
          )}
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {active > 0 ? <Pressable onPress={() => setActive((current) => Math.max(current - 1, 0))} disabled={finishing}
            accessibilityRole="button" accessibilityLabel="Previous step" style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}>
            <ArrowLeft size={22} color={ink} strokeWidth={1.8} />
          </Pressable> : <View style={{ width: 44 }} />}
          <View style={{ flexDirection: "row" }} accessibilityLabel={"Introduction, step " + (active + 1) + " of 4"}>
            {STEPS.map((item, index) => <Pressable key={item.label} onPress={() => setActive(index)} disabled={finishing}
              accessibilityRole="button" accessibilityLabel={"Step " + (index + 1) + ": " + item.label} accessibilityState={{ selected: active === index, disabled: finishing }}
              style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", gap: 5 }}>
              <Text className={active === index ? "font-body-bold" : "font-body"} style={{ fontSize: 14, color: active === index ? ink : mutedInk }}>{String(index + 1).padStart(2, "0")}</Text>
              <View style={{ width: 18, height: 2, backgroundColor: active === index ? ink : "transparent" }} />
            </Pressable>)}
          </View>
          <Text className="font-body" style={{ minWidth: 44, fontSize: 13, textAlign: "right", color: mutedInk }}>/ 04</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
