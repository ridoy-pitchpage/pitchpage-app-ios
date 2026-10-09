import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { ArrowUpRight } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";

import { useColors } from "@/theme/ThemeProvider";
import { appLight } from "@/theme/tokens";

const EXAMPLES = [
  { label: "Career", name: "Morgan Rivera", detail: "Construction project manager", image: require("../../assets/templates/split.webp") },
  { label: "Business", name: "Rachel Moreau", detail: "Fulfilment partner", image: require("../../assets/templates/scorecard.webp") },
  { label: "Sport", name: "Jaylen Reed", detail: "Student athlete", image: require("../../assets/templates/spotlight.webp") },
] as const;
const DESIGNS = [
  { label: "Personal", name: "Personal Brand", image: require("../../assets/templates/personal.webp") },
  { label: "Broadsheet", name: "Broadsheet", image: require("../../assets/templates/broadsheet.webp") },
  { label: "Spotlight", name: "Spotlight", image: require("../../assets/templates/spotlight.webp") },
] as const;
const MATERIALS = [
  { title: "Your resume", tag: "THE BACKGROUND", body: "Experience, skills, and where you've been." },
  { title: "Your work", tag: "THE PROOF", body: "Projects, results, photos. Show what you can do." },
  { title: "Your introduction", tag: "THE PERSON", body: "An optional short video, in your own words." },
] as const;

type Props = { active: number; compact: boolean; ink: string; mutedInk: string; rule: string };

/** Real template previews keep the introduction grounded in the page the user can actually make. */
export function OnboardingShowcase({ active, compact, ink, mutedInk, rule }: Props) {
  const colors = useColors();
  const { fontScale } = useWindowDimensions();
  const [example, setExample] = useState(0);
  const [design, setDesign] = useState(0);
  const current = EXAMPLES[example] ?? EXAMPLES[0];
  const selectedDesign = DESIGNS[design] ?? DESIGNS[0];
  const largeText = fontScale > 1.3;

  if (active === 0) return (
    <View style={{ gap: 14 }}>
      <Animated.View key={example} entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)} style={{ marginHorizontal: 6, transform: [{ rotate: "-2deg" }] }}>
        <Image source={current.image} contentFit="cover" style={{ width: "100%", aspectRatio: compact ? 1.8 : 1.55, borderRadius: 2, borderWidth: 1, borderColor: rule }}
          accessibilityLabel={"Example PitchPage for " + current.name + ", " + current.detail} />
        <View style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="font-body-bold" style={{ fontSize: 13, color: ink }}>{current.name}</Text>
            <Text className="font-body" style={{ fontSize: 13, color: mutedInk }}>{current.detail} · Example page</Text>
          </View>
          <ArrowUpRight size={20} color={colors.link} strokeWidth={1.5} />
        </View>
      </Animated.View>
      <View style={{ flexDirection: largeText ? "column" : "row", borderTopWidth: 1, borderTopColor: rule }}>
        {EXAMPLES.map((item, index) => <Pressable key={item.label} onPress={() => setExample(index)} accessibilityRole="button"
          accessibilityLabel={"Explore " + item.label.toLowerCase() + " example"} accessibilityState={{ selected: example === index }}
          style={{ flex: largeText ? undefined : 1, minHeight: 44, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: example === index ? ink : "transparent" }}>
          <Text className={example === index ? "font-body-bold" : "font-body"} style={{ fontSize: 14, color: example === index ? ink : mutedInk }}>{item.label}</Text>
        </Pressable>)}
      </View>
    </View>
  );

  if (active === 1) return (
    <View style={{ borderTopWidth: 2, borderTopColor: ink }}>
      {MATERIALS.map((item, index) => <View key={item.title} style={{ borderBottomWidth: 1, borderBottomColor: rule, paddingVertical: compact ? 14 : 19, flexDirection: "row", gap: 16 }}>
        <Text className="font-body-medium" style={{ paddingTop: 3, fontSize: 13, color: mutedInk }}>{String(index + 1).padStart(2, "0")}</Text>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: largeText ? "column" : "row", flexWrap: "wrap", alignItems: largeText ? "flex-start" : "center", justifyContent: "space-between", gap: 6 }}>
            <Text className="font-heading-semi" style={{ fontSize: 17, letterSpacing: -0.5, color: ink }}>{item.title}</Text>
            <Text className="font-body-bold" style={{ fontSize: 12, letterSpacing: 1, color: colors.link }}>{item.tag}</Text>
          </View>
          <Text className="font-body" style={{ fontSize: 14, lineHeight: 21, color: mutedInk }}>{item.body}</Text>
        </View>
      </View>)}
      <View style={{ paddingTop: 13, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <Text className="font-heading-semi" style={{ fontSize: 22, lineHeight: 24, color: colors.link }}>+</Text>
        <Text className="font-body" style={{ flex: 1, fontSize: 13, lineHeight: 20, color: mutedInk }}>Add what matters. Leave out what doesn't.</Text>
      </View>
    </View>
  );

  if (active === 2) return (
    <View style={{ gap: 12 }}>
      <View style={{ aspectRatio: compact ? 1.65 : 1.45, marginHorizontal: 7 }}>
        {!largeText ? <>
          <Image source={DESIGNS[(design + 1) % DESIGNS.length]?.image} contentFit="cover" accessible={false}
            style={{ position: "absolute", top: 6, bottom: 8, left: 16, right: 4, transform: [{ rotate: "7deg" }], opacity: 0.55, borderWidth: 3, borderColor: appLight.card }} />
          <Image source={DESIGNS[(design + 2) % DESIGNS.length]?.image} contentFit="cover" accessible={false}
            style={{ position: "absolute", top: 6, bottom: 8, left: 4, right: 16, transform: [{ rotate: "-7deg" }], opacity: 0.7, borderWidth: 3, borderColor: appLight.card }} />
        </> : null}
        <Animated.View key={design} entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
          style={{ position: "absolute", top: 0, bottom: 12, left: 8, right: 8, borderWidth: 3, borderColor: appLight.card, backgroundColor: appLight.card }}>
          <Image source={selectedDesign.image} contentFit="cover" style={{ width: "100%", height: "100%" }} accessibilityLabel={selectedDesign.name + " design example"} />
        </Animated.View>
      </View>
      <View style={{ flexDirection: largeText ? "column" : "row", borderTopWidth: 1, borderTopColor: rule }}>
        {DESIGNS.map((item, index) => <Pressable key={item.name} onPress={() => setDesign(index)} accessibilityRole="button"
          accessibilityLabel={"Preview " + item.name + " design"} accessibilityState={{ selected: design === index }}
          style={{ flex: largeText ? undefined : 1, minHeight: 44, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: design === index ? ink : "transparent" }}>
          <Text className={design === index ? "font-body-bold" : "font-body"} style={{ fontSize: 13, color: design === index ? ink : mutedInk }}>{item.label}</Text>
        </Pressable>)}
      </View>
      <Text className="font-body" style={{ fontSize: 13, textAlign: "center", color: mutedInk }}>A few of the actual PitchPage designs. Tap to explore.</Text>
    </View>
  );

  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: rule, padding: compact ? 16 : 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: rule }}>
          <Text className="font-body-bold" style={{ fontSize: 13, letterSpacing: 1.5, color: mutedInk }}>YOUR PAGE, READY TO SHARE</Text>
          <ArrowUpRight size={22} color={colors.link} strokeWidth={1.5} />
        </View>
        <View style={{ flexDirection: largeText ? "column" : "row", alignItems: "center", paddingVertical: 20, gap: 14 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text className="font-heading-semi" style={{ fontSize: 21, letterSpacing: -0.6, color: ink }}>One link.{"\n"}All of you.</Text>
            <Text className="font-body" style={{ fontSize: 13, color: colors.link }}>pitchpage.co/p/your-name</Text>
            <Text className="font-body" style={{ fontSize: 13, color: mutedInk }}>Example link and QR code</Text>
          </View>
          <View accessible accessibilityLabel="Example QR code linking to PitchPage" style={{ padding: 6, backgroundColor: appLight.card }}>
            <QRCode value="https://pitchpage.co" size={compact ? 62 : 74} color={appLight.primary} backgroundColor={appLight.card} />
          </View>
        </View>
        <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: rule, paddingTop: 14, gap: 16 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text className="font-heading" style={{ fontSize: 25, color: ink }}>Free</Text>
            <Text className="font-body" style={{ fontSize: 13, color: mutedInk }}>to build & edit</Text>
          </View>
          <View style={{ width: 1, backgroundColor: rule }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text className="font-heading" style={{ fontSize: 25, color: colors.link }}>Free</Text>
            <Text className="font-body" style={{ fontSize: 13, color: mutedInk }}>to publish your page</Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 5, height: 5, backgroundColor: colors.link }} />
        <Text className="font-body" style={{ flex: 1, fontSize: 13, lineHeight: 20, color: mutedInk }}>See page visits after you share. No subscription.</Text>
      </View>
    </View>
  );
}
