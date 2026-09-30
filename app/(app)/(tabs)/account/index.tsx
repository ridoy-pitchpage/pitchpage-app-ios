import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { Card } from "@/components/Card";
import { Screen, ScreenScroll } from "@/components/Screen";
import { Body, H1, H3, Muted } from "@/components/Text";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/auth/AuthProvider";
import { signOut } from "@/auth/auth-actions";
import { useMyProfile } from "@/api/queries";
import { APP_VARIANT, APP_VERSION } from "@/lib/config";
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
  const confirm = useConfirm();
  const { appearance, setAppearance } = useTheme();
  const colors = useColors();

  const name = profile.data?.display_name?.trim() || user?.email?.split("@")[0] || "Your account";
  const initial = name.charAt(0).toUpperCase();

  async function confirmSignOut() {
    const ok = await confirm({
      title: "Sign out?",
      message: "You'll need to sign in again to see your pages.",
      confirmLabel: "Sign out",
      destructive: true,
    });
    if (!ok) return;
    signOut().catch((error: unknown) => toast.error(error));
  }


  return (
    <Screen edges={["top"]}>
      <ScreenScroll contentClassName="pt-2 gap-5">
        <H1>Account</H1>

        {/*
          Your name is the point of this card, so it is the biggest thing on
          it; the email is how you signed in, which matters far less often.
          Tapping it goes where you would expect — to changing the name.
        */}
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/account/profile")}
          accessibilityRole="button"
          accessibilityLabel={`Signed in as ${name}. Change your name.`}
          className="flex-row items-center gap-3 rounded-card border border-border bg-card p-4 active:opacity-70"
        >
          <View
            className="h-12 w-12 items-center justify-center rounded-full bg-primary"
            accessibilityElementsHidden
          >
            <Body className="font-body-bold text-primary-foreground">{initial}</Body>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <H3 numberOfLines={1}>{name}</H3>
            {user?.email ? <Muted numberOfLines={1}>{user.email}</Muted> : null}
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>

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
          <H3>Settings</H3>
          <Card className="p-0">
            <Row label="Change password" onPress={() => router.push("/(app)/(tabs)/account/password")} />
            {/*
              One row instead of the ten that were here. Guides, the FAQ, what
              we measure, the legal pages — all things somebody reads once, and
              between them they buried the two settings that get used.
            */}
            <Row label="Help & about" onPress={() => router.push("/(app)/(tabs)/account/help")} />
            <Row
              label="Delete your account"
              onPress={() => router.push("/(app)/(tabs)/account/delete")}
              last
            />
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
