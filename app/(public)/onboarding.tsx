import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
} from "react-native-reanimated";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Body, H1, Muted } from "@/components/Text";
import { completeOnboarding } from "@/onboarding/storage";
import { useColors } from "@/theme/ThemeProvider";

const BRAND_MARK = require("../../assets/brand-mark.png");

const STEPS = [
  {
    number: "01",
    price: "Free",
    title: "Bring your material",
    body: "Upload your résumé, documents, photos, or clips. Your source material stays private.",
    image: require("../../assets/onboarding-material.webp"),
    imageLabel: "A creator gathering her résumé, photos, and video at her desk",
  },
  {
    number: "02",
    price: "Free",
    title: "Build the story",
    body: "Answer two questions. PitchPage composes the sections from what you actually supplied.",
    image: require("../../assets/onboarding-story.webp"),
    imageLabel: "The creator answering two questions while her page takes shape",
  },
  {
    number: "03",
    price: "Free",
    title: "Make it yours",
    body: "Try 30 complete designs with 20+ colour sets before you pay.",
    image: require("../../assets/onboarding-design.webp"),
    imageLabel: "The creator comparing complete page designs and colour palettes",
  },
  {
    number: "04",
    price: "$9",
    title: "Publish and share",
    body: "Publish for $9, send one memorable link, and see when someone opens it.",
    image: require("../../assets/onboarding-publish.webp"),
    imageLabel: "The creator sharing her finished page from her phone",
  },
] as const;

/**
 * The first launch.
 *
 * The art carries this screen, so it runs edge to edge and under the status
 * bar rather than sitting in a bordered card. A framed picture inside a
 * scrolling column reads as an illustration beside the text, and the look of
 * the thing is most of what is being shown here.
 *
 * The step number, the price and the position in the sequence were each said
 * twice before. They are said once now: the dots carry position, the eyebrow
 * carries the step and what it costs.
 */
export default function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [finishing, setFinishing] = useState(false);

  const step = STEPS[active] ?? STEPS[0];
  const last = active === STEPS.length - 1;
  // Just over half the screen, but never so tall on a small phone that the
  // words and the button stop fitting underneath.
  const heroHeight = Math.min(Math.max(Math.round(height * 0.52), 260), 460);

  function moveTo(next: number) {
    setDirection(next > active ? 1 : -1);
    setActive(next);
  }

  async function finish(path: "/(public)/sign-up" | "/(public)/sign-in") {
    if (finishing) return;
    setFinishing(true);
    try {
      await completeOnboarding();
    } catch {
      // Storage should never keep someone trapped in onboarding.
    } finally {
      router.replace(path);
      setFinishing(false);
    }
  }

  return (
    <Screen edges={["bottom"]}>
      <View style={{ height: heroHeight }} className="overflow-hidden bg-card">
        <Animated.View
          key={step.number}
          entering={FadeIn.duration(320)}
          style={StyleSheet.absoluteFill}
        >
          <Image
            source={step.image}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            contentPosition="center"
            transition={220}
            accessibilityLabel={step.imageLabel}
          />
        </Animated.View>

        {/*
          Both sit on a filled pill. The art behind them changes with every
          step, so nothing can be assumed about the contrast underneath.
        */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-4"
        >
          <View className="flex-row items-center gap-2 rounded-full bg-card px-3 py-2">
            <Image
              source={BRAND_MARK}
              style={{ width: 20, height: 20, borderRadius: 5 }}
              contentFit="cover"
            />
            <Text className="font-heading-semi text-[13px] text-foreground">PitchPage</Text>
          </View>
          <Pressable
            onPress={() => void finish("/(public)/sign-in")}
            accessibilityRole="link"
            accessibilityLabel="Sign in to an existing account"
            style={{ minHeight: 44 }}
            className="justify-center rounded-full bg-card px-4"
          >
            <Text className="font-body-bold text-[13px]" style={{ color: colors.link }}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-2 pt-5">
        <Dots active={active} title={step.title} />

        <Animated.View
          key={step.number}
          entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(240)}
          exiting={(direction > 0 ? FadeOutLeft : FadeOutRight).duration(160)}
          className="gap-2"
        >
          <View className="flex-row items-center gap-2">
            <Text
              className="font-body-bold text-[11px] uppercase"
              style={{ color: colors.link, letterSpacing: 1.6 }}
            >
              Step {step.number}
            </Text>
            <View className="rounded-full bg-secondary px-2.5 py-1">
              <Text className="font-body-bold text-[11px] text-foreground">{step.price}</Text>
            </View>
          </View>
          <H1 className="text-[29px] leading-[35px]">{step.title}</H1>
          <Body className="text-muted-foreground">{step.body}</Body>
        </Animated.View>
      </ScrollView>

      <View className="gap-2 px-5 pb-1 pt-2">
        <View className="flex-row gap-3">
          {active > 0 ? (
            <Button
              title="Back"
              variant="secondary"
              fullWidth={false}
              className="flex-1"
              icon={<ArrowLeft size={18} color={colors.foreground} />}
              onPress={() => moveTo(active - 1)}
            />
          ) : null}
          <Button
            title={last ? "Start free" : "Continue"}
            loading={finishing}
            fullWidth={active === 0}
            className={active > 0 ? "flex-[1.6]" : ""}
            icon={<ArrowRight size={18} color={colors.primaryForeground} />}
            haptic={last}
            onPress={() => (last ? void finish("/(public)/sign-up") : moveTo(active + 1))}
          />
        </View>
        {last ? (
          <Muted className="text-center text-[12px]">
            Build and explore every design before paying.
          </Muted>
        ) : null}
      </View>
    </Screen>
  );
}

/**
 * Position in the sequence, and nothing else.
 *
 * One element for VoiceOver rather than four: "step 3 of 4" is the whole of
 * what four dots convey, and hearing "dot, dot, dot, dot" is not that.
 */
function Dots({ active, title }: { active: number; title: string }) {
  const colors = useColors();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${active + 1} of ${STEPS.length}: ${title}`}
      accessibilityValue={{ min: 1, max: STEPS.length, now: active + 1 }}
      className="flex-row items-center gap-1.5"
    >
      {STEPS.map((item, index) => (
        <View
          key={item.number}
          style={{
            height: 6,
            width: index === active ? 22 : 6,
            borderRadius: 3,
            backgroundColor: index === active ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}
