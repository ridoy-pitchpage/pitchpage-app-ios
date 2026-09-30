import { Text, View } from "react-native";

export type BadgeTone = "live" | "draft" | "neutral" | "accent";

const TONE: Record<BadgeTone, { container: string; label: string }> = {
  // Published pages read as the positive state, so they take the brand primary.
  live: { container: "bg-primary", label: "text-primary-foreground" },
  draft: { container: "bg-muted", label: "text-muted-foreground" },
  neutral: { container: "border border-border bg-transparent", label: "text-muted-foreground" },
  accent: { container: "bg-accent", label: "text-accent-foreground" },
};

/**
 * A small status chip. The label always carries the meaning in words, never
 * colour alone (§19).
 */
export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${TONE[tone].container}`}>
      <Text className={`font-body-medium text-[12px] ${TONE[tone].label}`}>{label}</Text>
    </View>
  );
}
