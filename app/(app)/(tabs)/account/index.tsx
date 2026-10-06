import { Pressable, View } from "react-native";
import { router } from "expo-router";
import {
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  LogOut,
  Moon,
  Palette,
  Smartphone,
  Sun,
  Trash2,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Card } from "@/components/Card";
import { MotionEntrance } from "@/components/MotionEntrance";
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
import { mix } from "@/theme/tokens";

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
      <ScreenScroll contentClassName="pt-3 gap-5" contentContainerStyle={{ paddingBottom: 24 }}>
        <MotionEntrance className="gap-1">
          <Muted className="font-body-bold text-[11px] tracking-[1.5px]" style={{ color: colors.primary }}>
            MAKE YOURSELF AT HOME
          </Muted>
          <H1>Account</H1>
          <Muted>Your profile. Your preferences.</Muted>
        </MotionEntrance>

        {/*
          Your name is the point of this card, so it is the biggest thing on
          it; the email is how you signed in, which matters far less often.
          Tapping it goes where you would expect — to changing the name.
        */}
        <MotionEntrance index={1}>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/account/profile")}
          accessibilityRole="button"
          accessibilityLabel={`Signed in as ${name}. Change your name.`}
          className="active:opacity-80"
        >
          <Card className="flex-row items-center gap-4 p-5">
            <View
              className="h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: mix(colors.card, colors.accent, 0.16) }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Body adjustsFontSizeToFit numberOfLines={1} className="font-heading text-[23px]" style={{ color: colors.foreground }}>
                {initial}
              </Body>
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <H3 className="text-[19px] leading-7">{name}</H3>
              {user?.email ? (
                <Muted>
                  {user.email}
                </Muted>
              ) : null}
              <Muted className="font-body-bold text-[12px]" style={{ color: colors.primary }}>Edit profile</Muted>
            </View>
            <ChevronRight size={19} color={colors.mutedForeground} />
          </Card>
        </Pressable>
        </MotionEntrance>

        <MotionEntrance index={2} className="gap-2">
          <View className="flex-row items-center gap-2">
            <Palette size={19} color={colors.primary} />
            <H3>Appearance</H3>
          </View>
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
        </MotionEntrance>

        <MotionEntrance index={3} className="gap-2">
          <H3>Settings</H3>
          <Card className="p-0">
            <Row label="Change password" Icon={LockKeyhole} onPress={() => router.push("/(app)/(tabs)/account/password")} />
            {/*
              One row instead of the ten that were here. Guides, the FAQ, what
              we measure, the legal pages — all things somebody reads once, and
              between them they buried the two settings that get used.
            */}
            <Row label="Help & about" Icon={CircleHelp} onPress={() => router.push("/(app)/(tabs)/account/help")} />
            <Row
              label="Delete your account"
              Icon={Trash2}
              onPress={() => router.push("/(app)/(tabs)/account/delete")}
              destructive
              last
            />
          </Card>
        </MotionEntrance>

        <Pressable
          onPress={confirmSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-control border border-border bg-card px-4 active:opacity-70"
        >
          <LogOut size={18} color={colors.destructive} />
          <Body style={{ color: colors.destructive }}>Sign out</Body>
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

const APPEARANCE_ICON: Record<Appearance, LucideIcon> = {
  system: Smartphone,
  light: Sun,
  dark: Moon,
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
  const colors = useColors();
  const Icon = APPEARANCE_ICON[option];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={APPEARANCE_LABEL[option]}
      className="min-h-[76px] min-w-0 flex-1 items-center justify-center gap-2 rounded-control border px-1 py-3"
      style={{
        backgroundColor: selected ? mix(colors.card, colors.primary, 0.08) : colors.card,
        borderColor: selected ? colors.primary : "transparent",
      }}
    >
      <Icon size={20} color={selected ? colors.primary : colors.mutedForeground} />
      <Body className="font-body-bold text-center text-[13px]" style={{ color: selected ? colors.primary : colors.foreground }}>
        {APPEARANCE_LABEL[option]}
      </Body>
    </Pressable>
  );
}

function Row({
  label,
  Icon,
  onPress,
  last = false,
  destructive = false,
}: {
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  last?: boolean;
  destructive?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={[
        "min-h-[64px] flex-row items-center gap-3 px-4 py-3",
        last ? "" : "border-b border-border",
      ].join(" ")}
    >
      <View
        className="h-9 w-9 shrink-0 items-center justify-center rounded-control"
        style={{ backgroundColor: mix(colors.card, destructive ? colors.destructive : colors.primary, 0.08) }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Icon size={17} color={destructive ? colors.destructive : colors.primary} />
      </View>
      <Body className="min-w-0 flex-1">{label}</Body>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
