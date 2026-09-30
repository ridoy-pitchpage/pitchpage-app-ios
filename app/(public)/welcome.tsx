import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { ArrowRight, BarChart3, FileUp, Palette } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Button } from "@/components/Button";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, Muted } from "@/components/Text";
import { useColors } from "@/theme/ThemeProvider";

const BRAND_MARK = require("../../assets/brand-mark.png");
const AUTH_DESK = require("../../assets/auth-desk.webp");

const BENEFITS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: FileUp,
    title: "Start with your résumé",
    body: "Bring your experience in without starting over.",
  },
  {
    icon: Palette,
    title: "Make it feel like you",
    body: "Choose a polished style built for your work.",
  },
  {
    icon: BarChart3,
    title: "See what connects",
    body: "Share one link and understand what gets read.",
  },
];

export default function Welcome() {
  const colors = useColors();

  return (
    <Screen>
      <ScreenScroll contentClassName="pt-5 gap-6">
        <View className="flex-row items-center gap-3">
          <Image
            source={BRAND_MARK}
            style={{ width: 40, height: 40, borderRadius: 10 }}
            contentFit="cover"
          />
          <Text className="flex-1 font-heading-semi text-[17px] text-foreground">PitchPage</Text>
          <Pressable
            onPress={() => router.push("/(public)/sign-in")}
            accessibilityRole="link"
            style={{ minHeight: 44, justifyContent: "center" }}
            className="px-2"
          >
            <Text className="font-body-bold text-[14px]" style={{ color: colors.link }}>
              Sign in
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          <Text
            className="font-body-bold text-[11px] uppercase"
            style={{ color: colors.link, letterSpacing: 2.2 }}
          >
            More than a résumé
          </Text>
          <H1 className="text-[32px] leading-[40px]">Your story.{"\n"}One powerful link.</H1>
          <Body className="text-muted-foreground">
            Build a page that shows who you are, what you have done, and why it matters.
          </Body>
        </View>

        <View className="gap-3">
          <Button
            title="Create your PitchPage"
            size="lg"
            icon={<ArrowRight size={19} color={colors.primaryForeground} />}
            onPress={() => router.push("/(public)/sign-up")}
          />
          <Button
            title="See how it works"
            variant="secondary"
            onPress={() => router.push("/(public)/how-it-works")}
          />
          <Muted className="text-center">Free to build. Publish when you are ready.</Muted>
        </View>

        <View
          className="h-[210px] overflow-hidden rounded-card border border-border bg-card"
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
          <View className="absolute bottom-3 left-3 rounded-full bg-card px-3 py-2">
            <Text className="font-body-bold text-[12px] text-foreground">
              Built to be remembered
            </Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-card border border-border bg-card px-4">
          {BENEFITS.map(({ icon: Icon, title, body }, index) => (
            <View
              key={title}
              className={[
                "flex-row items-center gap-3 py-4",
                index < BENEFITS.length - 1 ? "border-b border-border" : "",
              ].join(" ")}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Icon size={19} color={colors.link} strokeWidth={2} />
              </View>
              <View className="flex-1 gap-0.5">
                <Body className="font-body-bold text-[15px]">{title}</Body>
                <Muted>{body}</Muted>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap justify-center gap-x-5 gap-y-1">
          <FooterLink label="Examples" href="/(public)/examples" />
          <FooterLink label="Pricing" href="/(public)/pricing" />
          <FooterLink label="Questions" href="/(public)/faq" />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function FooterLink({ label, href }: { label: string; href: string }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.push(href as never)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      <Muted style={{ color: colors.link }}>{label}</Muted>
    </Pressable>
  );
}
