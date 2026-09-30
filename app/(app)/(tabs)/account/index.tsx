import { Alert, Pressable, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as MailComposer from "expo-mail-composer";
import { ChevronRight } from "lucide-react-native";

import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/auth/AuthProvider";
import { signOut } from "@/auth/auth-actions";
import { useMyProfile } from "@/api/queries";
import { APP_VARIANT, APP_VERSION, SITE_URL, SUPPORT_EMAIL, WEB_LINKS } from "@/lib/config";
import { useTheme, type Appearance } from "@/theme/ThemeProvider";
import { useColors } from "@/theme/ThemeProvider";

/**
 * Account (S84). The website has no settings screen at all — only a theme
 * toggle and Sign out in its header — so most of this is new, and some of it is
 * required: the App Store expects account deletion inside the app (§10.6, M7).
 */
export default function AccountScreen() {
  const { user } = useAuth();
  const profile = useMyProfile();
  const toast = useToast();
  const { appearance, setAppearance } = useTheme();

  function confirmSignOut() {
    Alert.alert("Sign out?", "You'll need to sign in again to see your pages.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          signOut().catch((error: unknown) => toast.error(error));
        },
      },
    ]);
  }

  async function contactSupport() {
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      toast.error(new Error(`Email ${SUPPORT_EMAIL} and we'll help.`));
      return;
    }
    await MailComposer.composeAsync({
      recipients: [SUPPORT_EMAIL],
      subject: "PitchPage app",
    });
  }

  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <H1>Account</H1>

        <Card className="gap-1">
          <H3>{profile.data?.display_name ?? user?.email ?? "Signed in"}</H3>
          {user?.email ? <Muted>{user.email}</Muted> : null}
        </Card>

        <View className="gap-2">
          <H3>Appearance</H3>
          <Card className="flex-row gap-2 p-2">
            {(["system", "light", "dark"] as const).map((option) => (
              <AppearanceOption
                key={option}
                option={option}
                selected={appearance === option}
                onPress={() => setAppearance(option)}
              />
            ))}
          </Card>
        </View>

        <View className="gap-2">
          <H3>Help</H3>
          <Card className="p-0">
            <Row label="How it works" onPress={() => router.push("/(public)/how-it-works")} />
            <Row label="Questions" onPress={() => router.push("/(public)/faq")} />
            <Row label="Examples" onPress={() => router.push("/(public)/examples")} />
            <Row label="Pricing" onPress={() => router.push("/(public)/pricing")} />
            <Row label="Guides" onPress={() => open(`${SITE_URL}/guides`)} />
            <Row label="What we measure" onPress={() => open(WEB_LINKS.tracking)} />
            <Row label="Contact support" onPress={() => void contactSupport()} last />
          </Card>
        </View>

        <View className="gap-2">
          <H3>Legal</H3>
          <Card className="p-0">
            <Row label="Privacy Policy" onPress={() => open(WEB_LINKS.privacy)} />
            <Row label="Terms" onPress={() => open(WEB_LINKS.terms)} />
            <Row label="About PitchPage" onPress={() => open(WEB_LINKS.about)} last />
          </Card>
        </View>

        <Pressable
          onPress={confirmSignOut}
          accessibilityRole="button"
          className="min-h-[44px] justify-center rounded-control border border-border px-4 active:opacity-70"
        >
          <Body className="text-destructive">Sign out</Body>
        </Pressable>

        <Muted className="text-center">
          Version {APP_VERSION}
          {APP_VARIANT === "development" ? " (dev)" : ""}
        </Muted>
      </ScreenScroll>
    </Screen>
  );
}

function open(url: string) {
  void WebBrowser.openBrowserAsync(url);
}

const APPEARANCE_LABEL: Record<Appearance, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function AppearanceOption({
  option,
  selected,
  onPress,
}: {
  option: Appearance;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={APPEARANCE_LABEL[option]}
      className={[
        "min-h-[44px] flex-1 items-center justify-center rounded-control",
        selected ? "bg-primary" : "bg-transparent",
      ].join(" ")}
    >
      <Body className={selected ? "text-primary-foreground" : "text-foreground"}>
        {APPEARANCE_LABEL[option]}
      </Body>
    </Pressable>
  );
}

function Row({
  label,
  onPress,
  last = false,
}: {
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={[
        "min-h-[48px] flex-row items-center justify-between px-4",
        last ? "" : "border-b border-border",
      ].join(" ")}
    >
      <Body>{label}</Body>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
