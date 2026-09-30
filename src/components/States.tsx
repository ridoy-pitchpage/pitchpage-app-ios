import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { TriangleAlert } from "lucide-react-native";

import { Button } from "./Button";
import { Body, H3, Muted } from "./Text";
import { useColors } from "@/theme/ThemeProvider";
import { mix } from "@/theme/tokens";
import { userFacingErrorMessage } from "@/lib/errors";

/**
 * Loading, empty and error. Every screen has all three (master plan §20), so
 * they live here rather than being rewritten per screen.
 */

export function Loading({ label = "Loading…" }: { label?: string }) {
  const colors = useColors();
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8" accessibilityRole="progressbar">
      <ActivityIndicator color={colors.mutedForeground} />
      <Muted>{label}</Muted>
    </View>
  );
}

/** A grey block standing in for content that is still arriving. */
export function Skeleton({ className }: { className?: string }) {
  return <View className={["rounded-control bg-muted", className ?? "h-4 w-full"].join(" ")} />;
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  const colors = useColors();

  return (
    <View className="items-center gap-3 px-6 py-12">
      {/*
        The icon sits on a tinted disc. An empty screen with nothing but
        centred text has no focal point, and the eye has nowhere to land
        before it reads.
      */}
      {icon ? (
        <View
          className="mb-1 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: mix(colors.background, colors.primary, 0.1) }}
        >
          {icon}
        </View>
      ) : null}
      <H3 className="text-center">{title}</H3>
      {body ? <Body className="text-center text-muted-foreground">{body}</Body> : null}
      {action ? <View className="w-full pt-2">{action}</View> : null}
    </View>
  );
}

/**
 * Always shows a translated message and always offers a retry: a dead end with
 * a raw error string in it is the thing this exists to prevent.
 */
export function ErrorState({
  error,
  onRetry,
  title = "That didn't load",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const colors = useColors();

  return (
    <View className="items-center gap-3 px-6 py-12">
      <View
        className="mb-1 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: mix(colors.background, colors.destructive, 0.12) }}
      >
        <TriangleAlert size={26} color={colors.destructive} strokeWidth={2} />
      </View>
      <H3 className="text-center">{title}</H3>
      <Body className="text-center text-muted-foreground">{userFacingErrorMessage(error)}</Body>
      {onRetry ? (
        <View className="w-full pt-2">
          <Button title="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
