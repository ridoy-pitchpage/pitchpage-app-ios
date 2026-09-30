import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { Button } from "./Button";
import { Body, H3, Muted } from "./Text";
import { useColors } from "@/theme/ThemeProvider";
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
  return (
    <View className="items-center gap-3 px-6 py-12">
      {icon}
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
  return (
    <View className="items-center gap-3 px-6 py-12">
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
