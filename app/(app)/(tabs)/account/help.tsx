import { Pressable, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as MailComposer from "expo-mail-composer";
import { ChevronRight } from "lucide-react-native";

import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { SUPPORT_EMAIL, WEB_LINKS } from "@/lib/config";
import { useColors } from "@/theme/ThemeProvider";
import { MIN_TAP } from "@/theme/tokens";

/**
 * Help, guides and the legal pages, on their own screen.
 *
 * All of this used to sit on Account, where ten rows of things somebody reads
 * once buried the two they actually use — their name and their password. It is
 * one row there now and everything is still one tap from it.
 */
export default function HelpScreen() {
  const colors = useColors();
  const toast = useToast();

  async function contactSupport() {
    if (!(await MailComposer.isAvailableAsync())) {
      toast.error(new Error(`Email ${SUPPORT_EMAIL} and we'll help.`));
      return;
    }
    await MailComposer.composeAsync({ recipients: [SUPPORT_EMAIL], subject: "PitchPage app" });
  }

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <BackButton />
        <H1>Help &amp; about</H1>

        <View className="gap-2">
          <H3>Learn</H3>
          <Card className="p-0">
            <Row label="Guides" hint="Fifteen articles, readable offline" onPress={() => router.push("/(app)/(tabs)/account/guides")} />
            <Row label="How it works" onPress={() => router.push("/(public)/how-it-works")} />
            <Row label="Examples" onPress={() => router.push("/(public)/examples")} />
            <Row label="Questions" onPress={() => router.push("/(public)/faq")} />
            <Row label="Pricing" onPress={() => router.push("/(public)/pricing")} last />
          </Card>
        </View>

        <View className="gap-2">
          <H3>Privacy</H3>
          <Card className="p-0">
            <Row
              label="What we measure"
              hint="What your page records, and what it never keeps"
              onPress={() => router.push("/(app)/(tabs)/account/tracking")}
            />
            <Row label="Privacy Policy" onPress={() => void WebBrowser.openBrowserAsync(WEB_LINKS.privacy)} />
            <Row label="Terms" onPress={() => void WebBrowser.openBrowserAsync(WEB_LINKS.terms)} last />
          </Card>
        </View>

        <View className="gap-2">
          <H3>Get in touch</H3>
          {/*
            No "About PitchPage" link to the website here, deliberately: that
            page shows the web price and a "Buy one now" button, and an app that
            does not sell credits itself may show neither (Guideline 3.1.1).
          */}
          <Card className="p-0">
            <Row label="Contact support" hint={SUPPORT_EMAIL} onPress={() => void contactSupport()} last />
          </Card>
        </View>
      </ScreenScroll>
    </Screen>
  );

  function Row({
    label,
    hint,
    onPress,
    last = false,
  }: {
    label: string;
    hint?: string;
    onPress: () => void;
    last?: boolean;
  }) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={hint ? `${label}. ${hint}` : label}
        style={{ minHeight: MIN_TAP }}
        className={[
          "flex-row items-center gap-3 px-4 py-3 active:opacity-70",
          last ? "" : "border-b border-border",
        ].join(" ")}
      >
        <View className="min-w-0 flex-1 gap-0.5">
          <Body>{label}</Body>
          {hint ? <Muted numberOfLines={1}>{hint}</Muted> : null}
        </View>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </Pressable>
    );
  }
}
